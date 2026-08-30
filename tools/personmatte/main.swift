// personmatte — cut the speaker out of talking-head footage.
//
// Reads an H.264/HEVC mp4, runs Vision person segmentation per frame, and
// writes a ProRes 4444 .mov whose alpha channel is the person mask (soft
// edges, so hair feathers naturally). Remotion layers it above the overlay
// stack with <OffthreadVideo transparent> so graphics can sit BEHIND the speaker.
//
//   swiftc -O main.swift -o personmatte
//   ./personmatte input.mp4 output.mov [--fast] [--start s] [--dur s]
//
// The person mask alone drops hand-held objects (the fluffy mic) and can dip
// inside the figure, so the matte is the UNION of person segmentation and the
// foreground-instance mask (the "lift subject" model, which keeps held
// objects), shaped by a smoothstep so the interior is fully opaque and only
// the edge stays soft.
//
// Colour: the source BGRA bytes are copied VERBATIM — only the alpha byte is
// written, then premultiplied (ProRes 4444 stores premultiplied alpha). No
// CoreImage colour pipeline touches the RGB; an earlier CI-based version
// tinted skin highlights mint.
//
// ProRes 4444 at 1080x1920 is large (~1 GB/min). Matte files are derived —
// keep them in public/ only while a reel is in production.

import Accelerate
import AVFoundation
import CoreImage
import Foundation
import Vision

let args = CommandLine.arguments
guard args.count >= 3 else {
	FileHandle.standardError.write("usage: personmatte in.mp4 out.mov [--fast] [--start s] [--dur s]\n".data(using: .utf8)!)
	exit(1)
}
let inURL = URL(fileURLWithPath: args[1])
let outURL = URL(fileURLWithPath: args[2])
let fast = args.contains("--fast")
func flagValue(_ flag: String) -> Double? {
	guard let i = args.firstIndex(of: flag), i + 1 < args.count else { return nil }
	return Double(args[i + 1])
}
let startS = flagValue("--start")
let durS = flagValue("--dur")

try? FileManager.default.removeItem(at: outURL)

let asset = AVURLAsset(url: inURL)
let sem = DispatchSemaphore(value: 0)
var trackResult: AVAssetTrack?
Task {
	trackResult = try? await asset.loadTracks(withMediaType: .video).first
	sem.signal()
}
sem.wait()
guard let track = trackResult else {
	FileHandle.standardError.write("no video track\n".data(using: .utf8)!)
	exit(1)
}

var sizeResult = CGSize.zero
var fpsResult: Float = 30
let sem2 = DispatchSemaphore(value: 0)
Task {
	let (natural, transform, fps) = try! await track.load(.naturalSize, .preferredTransform, .nominalFrameRate)
	sizeResult = natural.applying(transform)
	sizeResult = CGSize(width: abs(sizeResult.width), height: abs(sizeResult.height))
	fpsResult = fps
	sem2.signal()
}
sem2.wait()
let W = Int(sizeResult.width)
let H = Int(sizeResult.height)
FileHandle.standardError.write("source \(W)x\(H) @ \(fpsResult)fps\n".data(using: .utf8)!)

let reader = try! AVAssetReader(asset: asset)
if let s = startS {
	let start = CMTime(seconds: s, preferredTimescale: 600)
	let dur = durS.map { CMTime(seconds: $0, preferredTimescale: 600) } ?? .positiveInfinity
	reader.timeRange = CMTimeRange(start: start, duration: dur)
} else if let d = durS {
	reader.timeRange = CMTimeRange(start: .zero, duration: CMTime(seconds: d, preferredTimescale: 600))
}
let readerOut = AVAssetReaderTrackOutput(
	track: track,
	outputSettings: [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA]
)
readerOut.alwaysCopiesSampleData = false
reader.add(readerOut)

let writer = try! AVAssetWriter(outputURL: outURL, fileType: .mov)
let writerIn = AVAssetWriterInput(
	mediaType: .video,
	outputSettings: [
		AVVideoCodecKey: AVVideoCodecType.proRes4444,
		AVVideoWidthKey: W,
		AVVideoHeightKey: H,
		AVVideoColorPropertiesKey: [
			AVVideoColorPrimariesKey: AVVideoColorPrimaries_ITU_R_709_2,
			AVVideoTransferFunctionKey: AVVideoTransferFunction_ITU_R_709_2,
			AVVideoYCbCrMatrixKey: AVVideoYCbCrMatrix_ITU_R_709_2,
		],
	]
)
writerIn.expectsMediaDataInRealTime = false
let adaptor = AVAssetWriterInputPixelBufferAdaptor(
	assetWriterInput: writerIn,
	sourcePixelBufferAttributes: [
		kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA,
		kCVPixelBufferWidthKey as String: W,
		kCVPixelBufferHeightKey as String: H,
	]
)
writer.add(writerIn)
writer.startWriting()

let request = VNGeneratePersonSegmentationRequest()
request.qualityLevel = fast ? .balanced : .accurate
request.outputPixelFormat = kCVPixelFormatType_OneComponent8
let fgRequest = VNGenerateForegroundInstanceMaskRequest()

// smoothstep(0.30, 0.70) as a byte LUT: interior → opaque, edge stays soft.
// Paired with the 5x5 erode below, the soft ramp sits INSIDE the silhouette,
// so no pale halo appears where the matte overlaps identical background.
let lut: [UInt8] = (0...255).map { v in
	let t = max(0, min(1, (Double(v) / 255 - 0.30) / 0.40))
	return UInt8((t * t * (3 - 2 * t)) * 255)
}

// Scratch planes for mask scaling / union.
var planeA = [UInt8](repeating: 0, count: W * H)
var planeB = [UInt8](repeating: 0, count: W * H)

func scaleInto(_ dst: inout [UInt8], mask: CVPixelBuffer) {
	CVPixelBufferLockBaseAddress(mask, .readOnly)
	defer { CVPixelBufferUnlockBaseAddress(mask, .readOnly) }
	let mw = CVPixelBufferGetWidth(mask)
	let mh = CVPixelBufferGetHeight(mask)
	let format = CVPixelBufferGetPixelFormatType(mask)
	var tmp: [UInt8]? = nil
	var srcPtr = CVPixelBufferGetBaseAddress(mask)!
	var srcRowBytes = CVPixelBufferGetBytesPerRow(mask)
	if format == kCVPixelFormatType_OneComponent32Float {
		// foreground-instance masks arrive as float planes
		var f = vImage_Buffer(data: srcPtr, height: vImagePixelCount(mh), width: vImagePixelCount(mw), rowBytes: srcRowBytes)
		tmp = [UInt8](repeating: 0, count: mw * mh)
		tmp!.withUnsafeMutableBytes { p in
			var b = vImage_Buffer(data: p.baseAddress, height: vImagePixelCount(mh), width: vImagePixelCount(mw), rowBytes: mw)
			vImageConvert_PlanarFtoPlanar8(&f, &b, 1.0, 0.0, vImage_Flags(kvImageNoFlags))
		}
		srcPtr = UnsafeMutableRawPointer(mutating: tmp!)
		srcRowBytes = mw
	}
	var src = vImage_Buffer(data: srcPtr, height: vImagePixelCount(mh), width: vImagePixelCount(mw), rowBytes: srcRowBytes)
	dst.withUnsafeMutableBytes { p in
		var d = vImage_Buffer(data: p.baseAddress, height: vImagePixelCount(H), width: vImagePixelCount(W), rowBytes: W)
		vImageScale_Planar8(&src, &d, nil, vImage_Flags(kvImageHighQualityResampling))
	}
	withExtendedLifetime(tmp) {}
}

var started = false
var frames = 0
let clock = Date()

reader.startReading()
while reader.status == .reading {
	guard let sample = readerOut.copyNextSampleBuffer() else { break }
	guard let pixels = CMSampleBufferGetImageBuffer(sample) else { continue }
	let pts = CMSampleBufferGetPresentationTimeStamp(sample)
	if !started {
		writer.startSession(atSourceTime: pts)
		started = true
	}

	let handler = VNImageRequestHandler(cvPixelBuffer: pixels, options: [:])
	try? handler.perform([request, fgRequest])
	guard let mask = request.results?.first?.pixelBuffer else { continue }
	scaleInto(&planeA, mask: mask)
	if let fg = fgRequest.results?.first,
	   let fgMask = try? fg.generateScaledMaskForImage(forInstances: fg.allInstances, from: handler) {
		scaleInto(&planeB, mask: fgMask)
		for i in 0..<(W * H) { planeA[i] = max(planeA[i], planeB[i]) }
	}

	// Erode the union mask ~2px so the feathered edge falls inside the figure.
	planeA.withUnsafeMutableBytes { p in
		var buf = vImage_Buffer(data: p.baseAddress, height: vImagePixelCount(H), width: vImagePixelCount(W), rowBytes: W)
		planeB.withUnsafeMutableBytes { q in
			var dst = vImage_Buffer(data: q.baseAddress, height: vImagePixelCount(H), width: vImagePixelCount(W), rowBytes: W)
			vImageMin_Planar8(&buf, &dst, nil, 0, 0, 5, 5, vImage_Flags(kvImageNoFlags))
		}
	}
	swap(&planeA, &planeB)

	var outBuffer: CVPixelBuffer?
	CVPixelBufferPoolCreatePixelBuffer(nil, adaptor.pixelBufferPool!, &outBuffer)
	guard let out = outBuffer else { continue }

	CVPixelBufferLockBaseAddress(pixels, .readOnly)
	CVPixelBufferLockBaseAddress(out, [])
	let srcBase = CVPixelBufferGetBaseAddress(pixels)!.assumingMemoryBound(to: UInt8.self)
	let dstBase = CVPixelBufferGetBaseAddress(out)!.assumingMemoryBound(to: UInt8.self)
	let srcRow = CVPixelBufferGetBytesPerRow(pixels)
	let dstRow = CVPixelBufferGetBytesPerRow(out)
	for y in 0..<H {
		let s = srcBase + y * srcRow
		let d = dstBase + y * dstRow
		memcpy(d, s, W * 4)
		let m = y * W
		for x in 0..<W {
			d[x * 4 + 3] = lut[Int(planeA[m + x])]
		}
	}
	// ProRes 4444 stores premultiplied alpha; only edge pixels change. The
	// RGBA variant multiplies bytes 0–2 by byte 3, which is also correct for
	// BGRA's memory layout.
	var dstV = vImage_Buffer(data: dstBase, height: vImagePixelCount(H), width: vImagePixelCount(W), rowBytes: dstRow)
	vImagePremultiplyData_RGBA8888(&dstV, &dstV, vImage_Flags(kvImageNoFlags))
	CVPixelBufferUnlockBaseAddress(out, [])
	CVPixelBufferUnlockBaseAddress(pixels, .readOnly)

	while !writerIn.isReadyForMoreMediaData { usleep(2000) }
	adaptor.append(out, withPresentationTime: pts)
	frames += 1
	if frames % 150 == 0 {
		let rate = Double(frames) / -clock.timeIntervalSinceNow
		FileHandle.standardError.write("\(frames) frames (\(String(format: "%.1f", rate)) fps)\n".data(using: .utf8)!)
	}
}

writerIn.markAsFinished()
let sem3 = DispatchSemaphore(value: 0)
writer.finishWriting { sem3.signal() }
sem3.wait()
let rate = Double(frames) / -clock.timeIntervalSinceNow
FileHandle.standardError.write("done: \(frames) frames → \(outURL.path) (\(String(format: "%.1f", rate)) fps)\n".data(using: .utf8)!)
