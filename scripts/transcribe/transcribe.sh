#!/usr/bin/env bash
# Transcribe un audio local (WhatsApp .opus, wav, m4a, mp3) a texto reutilizable.
# Uso:
#   ./scripts/transcribe/transcribe.sh "/ruta/audio.opus"
#   ./scripts/transcribe/transcribe.sh "/ruta/audio.opus" --client "bodega-x"
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
CLIENT="general"
AUDIO=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --client)
      CLIENT="${2:-general}"
      shift 2
      ;;
    --help|-h)
      echo "Uso: $0 <audio> [--client nombre]"
      exit 0
      ;;
    *)
      AUDIO="$1"
      shift
      ;;
  esac
done

if [[ -z "${AUDIO}" || ! -f "${AUDIO}" ]]; then
  echo "No encuentro el audio. Pasá la ruta completa al archivo." >&2
  exit 2
fi

if [[ -z "${OPENAI_API_KEY:-}" ]]; then
  if [[ -f "${ROOT}/frontend/.env.local" ]]; then
    # shellcheck disable=SC1091
    set -a
    source "${ROOT}/frontend/.env.local"
    set +a
  elif [[ -f "${ROOT}/.env" ]]; then
    set -a
    # shellcheck disable=SC1091
    source "${ROOT}/.env"
    set +a
  fi
fi

if [[ -z "${OPENAI_API_KEY:-}" ]]; then
  echo "Falta OPENAI_API_KEY en el entorno, frontend/.env.local o .env" >&2
  exit 2
fi

STAMP="$(date +%Y-%m-%d)"
SAFE_CLIENT="$(echo "${CLIENT}" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9_-]+/-/g')"
OUT_DIR="${ROOT}/transcripts/${SAFE_CLIENT}"
mkdir -p "${OUT_DIR}"
WORK="$(mktemp -d /tmp/sr360-transcribe.XXXXXX)"
trap 'rm -rf "${WORK}"' EXIT

BASE="$(basename "${AUDIO}")"
EXT="${BASE##*.}"
EXT_LOWER="$(echo "${EXT}" | tr '[:upper:]' '[:lower:]')"
UPLOAD="${WORK}/audio.${EXT_LOWER}"
cp "${AUDIO}" "${UPLOAD}"

# WhatsApp manda .opus en contenedor Ogg; la API lo acepta mejor como .ogg
if [[ "${EXT_LOWER}" == "opus" ]]; then
  cp "${UPLOAD}" "${WORK}/audio.ogg"
  UPLOAD="${WORK}/audio.ogg"
fi

RAW="${WORK}/raw.json"
HTTP_CODE="$(
  curl -sS https://api.openai.com/v1/audio/transcriptions \
    -H "Authorization: Bearer ${OPENAI_API_KEY}" \
    -F "file=@${UPLOAD}" \
    -F "model=gpt-4o-transcribe" \
    -F "language=es" \
    -F "response_format=json" \
    -o "${RAW}" \
    -w "%{http_code}"
)"

if [[ "${HTTP_CODE}" != "200" ]]; then
  echo "Falló la transcripción (HTTP ${HTTP_CODE})." >&2
  python3 -c "import pathlib; print(pathlib.Path('${RAW}').read_text()[:800])" >&2
  exit 1
fi

OUT_TXT="${OUT_DIR}/${STAMP}.txt"
python3 - "${RAW}" "${OUT_TXT}" "${AUDIO}" "${CLIENT}" <<'PY'
import json, sys, pathlib
raw_path, out_path, audio, client = sys.argv[1:5]
data = json.loads(pathlib.Path(raw_path).read_text())
if "error" in data:
    raise SystemExit(data["error"])
text = (data.get("text") or "").strip()
header = f"# Transcripción · {client}\n# Fuente: {audio}\n\n"
pathlib.Path(out_path).write_text(header + text + "\n", encoding="utf-8")
print(text)
print(f"\n[guardado] {out_path}", file=sys.stderr)
PY
