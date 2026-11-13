#!/usr/bin/env bash
# Development-only helper for case-study demo videos.
# Does not run during site builds.

set -euo pipefail

usage() {
  echo "Usage: $0 [--force] <input-video> <output-mp4> [crf]" >&2
  echo "  crf defaults to 24 (browser-safe VFR encode)." >&2
  exit 2
}

FORCE=0
if [[ "${1:-}" == "--force" ]]; then
  FORCE=1
  shift
fi

if [[ $# -lt 2 || $# -gt 3 ]]; then
  usage
fi

INPUT="$1"
OUTPUT="$2"
CRF="${3:-24}"

if [[ ! -f "$INPUT" ]]; then
  echo "error: input file not found: $INPUT" >&2
  exit 1
fi

if [[ ! "$CRF" =~ ^[0-9]+$ ]]; then
  echo "error: CRF must be an integer: $CRF" >&2
  exit 1
fi

if [[ -e "$OUTPUT" && "$FORCE" -ne 1 ]]; then
  echo "error: output already exists: $OUTPUT" >&2
  echo "re-run with --force to replace it." >&2
  exit 1
fi

if ! command -v ffmpeg >/dev/null 2>&1 || ! command -v ffprobe >/dev/null 2>&1; then
  echo "error: ffmpeg and ffprobe are required." >&2
  exit 1
fi

mkdir -p "$(dirname "$OUTPUT")"

echo "Source:"
ffprobe -v error \
  -select_streams v:0 \
  -show_entries format=duration,size \
  -show_entries stream=codec_name,width,height,r_frame_rate,avg_frame_rate,pix_fmt \
  -of default=noprint_wrappers=1 \
  "$INPUT"

echo
echo "Encoding CRF $CRF → $OUTPUT"

ffmpeg -y -i "$INPUT" \
  -c:v libx264 \
  -preset slow \
  -crf "$CRF" \
  -pix_fmt yuv420p \
  -an \
  -movflags +faststart \
  -fps_mode vfr \
  -avoid_negative_ts make_zero \
  "$OUTPUT"

echo
echo "Output:"
ffprobe -v error \
  -select_streams v:0 \
  -show_entries format=duration,size,bit_rate,start_time \
  -show_entries stream=codec_name,profile,level,width,height,pix_fmt,r_frame_rate,avg_frame_rate,time_base,duration,start_time,nb_frames \
  -of default=noprint_wrappers=1 \
  "$OUTPUT"

echo
ls -lh "$OUTPUT"
