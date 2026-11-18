"""Narration for an episode: python narrate.py episodes/x.js kz
Piper speaks every sentence; ffmpeg cleans it (same chain as the informatics videos);
the result is one WAV and a timing file that tells the scene engine when each sentence starts.
Piper fails on non-ASCII paths, so all audio work happens in C:\\Users\\user\\vtmp."""
import json, os, subprocess, sys, wave

EP_FILE, LANG = sys.argv[1], sys.argv[2]
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PIPER = r'C:\Users\user\piper\piper.exe'
VOICE = {'kz': r'C:\Users\user\piper\kk_KZ-issai-high.onnx', 'ru': r'C:\Users\user\piper\ru_RU-irina-medium.onnx'}[LANG]
ARGS = {'kz': ['--length_scale', '1.05', '--noise_scale', '0.33', '--noise_w', '0.4'],
        'ru': ['--length_scale', '1.0', '--noise_scale', '0.5', '--noise_w', '0.6']}[LANG]
LEAD, SEG_GAP, OUTRO, PAD = 0.8, 0.7, 3.5, 0.32
RATE = 44100

data = json.loads(subprocess.run(['node', os.path.join(ROOT, 'tools', 'extract.cjs'), EP_FILE, LANG], capture_output=True, check=True).stdout.decode('utf-8'))
work = os.path.join(r'C:\Users\user\vtmp', f"{data['id']}-{LANG}")
os.makedirs(work, exist_ok=True)

CLEAN = ('aresample=44100:resampler=soxr,'
         'silenceremove=start_periods=1:start_threshold=-42dB:start_silence=0.02,'
         'areverse,silenceremove=start_periods=1:start_threshold=-38dB:start_silence=0.03,afade=t=in:d=0.14:curve=qsin,areverse,'
         'afade=t=in:d=0.03,deesser=i=0.5:m=0.5:f=0.5,'
         'agate=threshold=0.02:ratio=2:range=0.25:attack=5:release=180,'
         f'apad=pad_dur={PAD}')

def dur(p):
    with wave.open(p) as w:
        return w.getnframes() / w.getframerate()

pcm = bytearray()
def silence(sec):
    pcm.extend(b'\x00\x00' * int(round(sec * RATE)))

timing = {'lang': LANG, 'sentences': [], 'segs': [], 'outro': OUTRO}
silence(LEAD)
t = LEAD
prev_seg = -1
for k, s in enumerate(data['sentences']):
    if s['seg'] != prev_seg:
        if prev_seg >= 0:
            silence(SEG_GAP); t += SEG_GAP
            timing['segs'][-1]['end'] = t
        timing['segs'].append({'start': t, 'end': None})
        prev_seg = s['seg']
    raw, clean = os.path.join(work, f'r{k}.wav'), os.path.join(work, f'c{k}.wav')
    subprocess.run([PIPER, '-m', VOICE, *ARGS, '-f', raw], input=s['text'].encode('utf-8'), check=True, capture_output=True)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', raw, '-af', CLEAN, '-ac', '1', '-ar', str(RATE), '-sample_fmt', 's16', clean], check=True)
    d = dur(clean)
    with wave.open(clean) as w:
        pcm.extend(w.readframes(w.getnframes()))
    timing['sentences'].append({'seg': s['seg'], 'i': s['i'], 'start': round(t, 3), 'dur': round(d - PAD, 3), 'text': s['text']})
    t += d
    if s['pause']:
        silence(s['pause']); t += s['pause']
timing['segs'][-1]['end'] = t
silence(OUTRO); t += OUTRO
timing['total'] = round(t, 3)

wav_out = os.path.join(work, 'narration.wav')
with wave.open(wav_out, 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(RATE); w.writeframes(bytes(pcm))
os.makedirs(os.path.join(ROOT, 'out'), exist_ok=True)
with open(os.path.join(ROOT, 'out', f"{data['id']}-{LANG}.timing.json"), 'w', encoding='utf-8') as f:
    json.dump(timing, f, ensure_ascii=False, indent=1)
print(f"{data['id']} {LANG}: {len(timing['sentences'])} sentences, {t:.1f} s -> {wav_out}")
