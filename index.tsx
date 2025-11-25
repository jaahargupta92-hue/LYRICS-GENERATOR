import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";
import { Upload, Music, CheckCircle, Loader2, Play, Pause, Download, Wand2, Type, Palette, Video as VideoIcon, Settings, ChevronDown, ChevronUp, Sliders, Clock, RotateCcw, Pencil, Trash2, Plus, PlayCircle } from 'lucide-react';

// --- Types ---

interface Subtitle {
  id: number;
  text: string;
  start: number;
  end: number;
}

type ProcessingStep = 'idle' | 'uploading' | 'analyzing' | 'transcribing' | 'completed' | 'error';

interface StyleConfig {
  id: string;
  name: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  outlineColor: string;
  outlineWidth: number;
  shadow: string;
  animation: string;
  positionY: number; // % from top
  fontWeight: string;
  background?: string;
}

interface ExportConfig {
  resolution: 'original' | '1080p' | '720p';
  quality: 'high' | 'medium' | 'low';
}

// --- Constants & Styles ---

const FONT_OPTIONS = [
  { name: 'Poppins', value: "'Poppins', sans-serif" },
  { name: 'Montserrat', value: "'Montserrat', sans-serif" },
  { name: 'Baloo 2', value: "'Baloo 2', sans-serif" },
  { name: 'Noto Sans Devanagari', value: "'Noto Sans Devanagari', sans-serif" },
  { name: 'Kalam', value: "'Kalam', cursive" },
  { name: 'Teko', value: "'Teko', sans-serif" },
  { name: 'Hind', value: "'Hind', sans-serif" },
  { name: 'Rozha One', value: "'Rozha One', serif" },
  { name: 'Yantramanav', value: "'Yantramanav', sans-serif" },
  { name: 'Amita', value: "'Amita', cursive" },
  { name: 'Arya', value: "'Arya', sans-serif" },
  { name: 'Asar', value: "'Asar', serif" },
  { name: 'Eczar', value: "'Eczar', serif" },
  { name: 'Gotu', value: "'Gotu', sans-serif" },
  { name: 'Halant', value: "'Halant', serif" },
  { name: 'Khand', value: "'Khand', sans-serif" },
  { name: 'Martel', value: "'Martel', serif" },
  { name: 'Mukta', value: "'Mukta', sans-serif" },
  { name: 'Rajdhani', value: "'Rajdhani', sans-serif" },
  { name: 'Sarpanch', value: "'Sarpanch', sans-serif" },
  { name: 'Tillana', value: "'Tillana', cursive" },
  { name: 'Laila', value: "'Laila', serif" },
  { name: 'Vesper Libre', value: "'Vesper Libre', serif" },
  { name: 'Karma', value: "'Karma', serif" },
  { name: 'Kadwa', value: "'Kadwa', serif" },
  { name: 'Kurale', value: "'Kurale', serif" },
  { name: 'Sura', value: "'Sura', serif" },
  { name: 'Sahitya', value: "'Sahitya', serif" },
  { name: 'Ranga', value: "'Ranga', cursive" }
];

const STYLES: StyleConfig[] = [
  { id: 'classic', name: 'Classic', fontFamily: "'Poppins', sans-serif", fontSize: 50, color: '#ffffff', outlineColor: '#000000', outlineWidth: 3, shadow: '0px 4px 6px rgba(0,0,0,0.5)', animation: 'fade', positionY: 80, fontWeight: '700' },
  { id: 'neon_yellow', name: 'Neon Yellow', fontFamily: "'Baloo 2', sans-serif", fontSize: 60, color: '#ffff00', outlineColor: '#000000', outlineWidth: 2, shadow: '0 0 10px #ffff00, 0 0 20px #ff0000', animation: 'pop', positionY: 75, fontWeight: '800' },
  { id: 'neon_blue', name: 'Neon Blue', fontFamily: "'Teko', sans-serif", fontSize: 70, color: '#00ffff', outlineColor: '#000000', outlineWidth: 2, shadow: '0 0 10px #00ffff, 0 0 20px #0000ff', animation: 'pop', positionY: 75, fontWeight: '600' },
  { id: 'neon_pink', name: 'Neon Pink', fontFamily: "'Rajdhani', sans-serif", fontSize: 60, color: '#ff00ff', outlineColor: '#000000', outlineWidth: 2, shadow: '0 0 10px #ff00ff, 0 0 20px #800080', animation: 'pop', positionY: 75, fontWeight: '700' },
  { id: 'karaoke_box', name: 'Karaoke Box', fontFamily: "'Noto Sans Devanagari', sans-serif", fontSize: 45, color: '#ffffff', outlineColor: 'transparent', outlineWidth: 0, shadow: 'none', animation: 'slide', positionY: 85, fontWeight: '600', background: 'rgba(0,0,0,0.7)' },
  { id: 'vlog_bold', name: 'Vlog Bold', fontFamily: "'Montserrat', sans-serif", fontSize: 55, color: '#ffffff', outlineColor: 'transparent', outlineWidth: 0, shadow: '2px 2px 0px #000000', animation: 'scale', positionY: 80, fontWeight: '900', background: '#000000' },
  { id: 'dramatic', name: 'Dramatic', fontFamily: "'Rozha One', serif", fontSize: 65, color: '#ffdddd', outlineColor: '#330000', outlineWidth: 2, shadow: '0px 10px 20px rgba(0,0,0,0.8)', animation: 'fade', positionY: 70, fontWeight: '400' },
  { id: 'clean_white', name: 'Clean White', fontFamily: "'Hind', sans-serif", fontSize: 48, color: '#ffffff', outlineColor: '#000000', outlineWidth: 2, shadow: 'none', animation: 'fade', positionY: 85, fontWeight: '600' },
  { id: 'comic_fun', name: 'Comic Fun', fontFamily: "'Tillana', cursive", fontSize: 55, color: '#ff9900', outlineColor: '#ffffff', outlineWidth: 3, shadow: '3px 3px 0px #000000', animation: 'pop', positionY: 80, fontWeight: '700' },
  { id: 'horror', name: 'Horror', fontFamily: "'Sarpanch', sans-serif", fontSize: 65, color: '#ff0000', outlineColor: '#000000', outlineWidth: 1, shadow: '0px 0px 15px #000000', animation: 'scale', positionY: 70, fontWeight: '700' },
  { id: 'soft_poet', name: 'Soft Poet', fontFamily: "'Amita', cursive", fontSize: 50, color: '#fff0f5', outlineColor: '#000000', outlineWidth: 1, shadow: '0px 2px 4px rgba(0,0,0,0.3)', animation: 'fade', positionY: 80, fontWeight: '400' },
  { id: 'gamer_green', name: 'Gamer Green', fontFamily: "'Teko', sans-serif", fontSize: 75, color: '#00ff00', outlineColor: '#000000', outlineWidth: 2, shadow: '0px 0px 10px #00ff00', animation: 'scale', positionY: 75, fontWeight: '600' },
  { id: 'golden_hour', name: 'Golden Hour', fontFamily: "'Karma', serif", fontSize: 58, color: '#ffd700', outlineColor: '#000000', outlineWidth: 2, shadow: '2px 2px 4px rgba(0,0,0,0.6)', animation: 'fade', positionY: 80, fontWeight: '600' },
  { id: 'fire', name: 'Fire', fontFamily: "'Ranga', cursive", fontSize: 65, color: '#ff4500', outlineColor: '#ffff00', outlineWidth: 2, shadow: '0px 0px 8px #ff4500', animation: 'pop', positionY: 78, fontWeight: '700' },
  { id: 'ocean', name: 'Ocean', fontFamily: "'Asar', serif", fontSize: 55, color: '#e0ffff', outlineColor: '#000080', outlineWidth: 2, shadow: 'none', animation: 'fade', positionY: 82, fontWeight: '500' },
  { id: 'retro_teal', name: 'Retro Teal', fontFamily: "'Kurale', serif", fontSize: 52, color: '#008080', outlineColor: '#ffffff', outlineWidth: 2, shadow: '4px 4px 0px #000000', animation: 'slide', positionY: 80, fontWeight: '400' },
  { id: 'love_pink', name: 'Love Pink', fontFamily: "'Laila', serif", fontSize: 54, color: '#ff69b4', outlineColor: '#ffffff', outlineWidth: 3, shadow: 'none', animation: 'pop', positionY: 80, fontWeight: '600' },
  { id: 'news_ticker', name: 'News Ticker', fontFamily: "'Khand', sans-serif", fontSize: 48, color: '#ffffff', outlineColor: 'transparent', outlineWidth: 0, shadow: 'none', animation: 'slide', positionY: 90, fontWeight: '600', background: '#cc0000' },
  { id: 'bold_impact', name: 'Bold Impact', fontFamily: "'Yantramanav', sans-serif", fontSize: 60, color: '#ffffff', outlineColor: '#000000', outlineWidth: 4, shadow: 'none', animation: 'scale', positionY: 50, fontWeight: '900' },
  { id: 'elegant_serif', name: 'Elegant', fontFamily: "'Eczar', serif", fontSize: 55, color: '#f5f5dc', outlineColor: '#4b0082', outlineWidth: 2, shadow: '0px 3px 6px rgba(0,0,0,0.4)', animation: 'fade', positionY: 80, fontWeight: '600' },
  { id: 'sketch', name: 'Sketch', fontFamily: "'Kalam', cursive", fontSize: 52, color: '#000000', outlineColor: '#ffffff', outlineWidth: 2, shadow: 'none', animation: 'slide', positionY: 80, fontWeight: '400', background: '#ffffff' },
  { id: 'cyberpunk', name: 'Cyberpunk', fontFamily: "'Rajdhani', sans-serif", fontSize: 60, color: '#ffff00', outlineColor: '#000000', outlineWidth: 2, shadow: '4px 4px 0px #000000', animation: 'glitch', positionY: 80, fontWeight: '700', background: 'rgba(0,0,0,0.8)' },
  { id: 'minimal_dark', name: 'Minimal Dark', fontFamily: "'Mukta', sans-serif", fontSize: 44, color: '#cccccc', outlineColor: 'transparent', outlineWidth: 0, shadow: 'none', animation: 'fade', positionY: 85, fontWeight: '400', background: 'rgba(0,0,0,0.3)' },
  { id: 'vintage_film', name: 'Vintage Film', fontFamily: "'Vesper Libre', serif", fontSize: 50, color: '#e6e6fa', outlineColor: '#000000', outlineWidth: 1, shadow: '1px 1px 2px #000000', animation: 'fade', positionY: 75, fontWeight: '400' },
  { id: 'street_tag', name: 'Street Tag', fontFamily: "'Sura', serif", fontSize: 56, color: '#fffff0', outlineColor: '#000000', outlineWidth: 3, shadow: '5px 5px 0px #ff0000', animation: 'pop', positionY: 80, fontWeight: '700' },
  { id: 'nature_green', name: 'Nature', fontFamily: "'Gotu', sans-serif", fontSize: 48, color: '#f0fff0', outlineColor: '#006400', outlineWidth: 1, shadow: '0px 2px 5px rgba(0,0,0,0.3)', animation: 'fade', positionY: 85, fontWeight: '600' },
  { id: 'royal_gold', name: 'Royal Gold', fontFamily: "'Kadwa', serif", fontSize: 54, color: '#d4af37', outlineColor: '#000000', outlineWidth: 2, shadow: '0px 4px 8px rgba(0,0,0,0.6)', animation: 'fade', positionY: 80, fontWeight: '700' },
  { id: 'bubbly', name: 'Bubbly', fontFamily: "'Baloo 2', sans-serif", fontSize: 62, color: '#ff69b4', outlineColor: '#ffffff', outlineWidth: 3, shadow: '0px 0px 10px #ff69b4', animation: 'pop', positionY: 75, fontWeight: '800' },
  { id: 'subtle_grey', name: 'Subtle Grey', fontFamily: "'Halant', serif", fontSize: 46, color: '#d3d3d3', outlineColor: '#000000', outlineWidth: 1, shadow: '1px 1px 1px rgba(0,0,0,0.5)', animation: 'fade', positionY: 88, fontWeight: '500' },
  { id: 'thick_stroke', name: 'Thick Stroke', fontFamily: "'Arya', sans-serif", fontSize: 60, color: '#ffffff', outlineColor: '#000000', outlineWidth: 6, shadow: 'none', animation: 'scale', positionY: 80, fontWeight: '700' },
  { id: 'cinematic', name: 'Cinematic', fontFamily: "'Martel', serif", fontSize: 50, color: '#ffffff', outlineColor: 'transparent', outlineWidth: 0, shadow: '0px 10px 30px rgba(0,0,0,1)', animation: 'fade', positionY: 82, fontWeight: '400', background: 'transparent' },
  { id: 'glitchy', name: 'Glitchy', fontFamily: "'Rajdhani', sans-serif", fontSize: 58, color: '#00ff00', outlineColor: '#ff0000', outlineWidth: 1, shadow: '2px 0px 0px #0000ff, -2px 0px 0px #ff0000', animation: 'glitch', positionY: 78, fontWeight: '700' },
  { id: 'storybook', name: 'Storybook', fontFamily: "'Sahitya', serif", fontSize: 55, color: '#8b4513', outlineColor: '#f5deb3', outlineWidth: 2, shadow: '2px 2px 4px rgba(0,0,0,0.3)', animation: 'fade', positionY: 80, fontWeight: '600' }
];

const App = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [status, setStatus] = useState<ProcessingStep>('idle');
  const [progress, setProgress] = useState(0);
  const [currentStyleId, setCurrentStyleId] = useState<string>(STYLES[0].id);
  const [customStyle, setCustomStyle] = useState<StyleConfig>(STYLES[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'design' | 'lyrics'>('design'); // New Tab State
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [exportConfig, setExportConfig] = useState<ExportConfig>({ resolution: 'original', quality: 'high' });
  const [syncOffset, setSyncOffset] = useState(0); // in seconds
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);

  // Apply selected style preset to custom style
  useEffect(() => {
    const style = STYLES.find(s => s.id === currentStyleId);
    if (style) {
      setCustomStyle(style);
    }
  }, [currentStyleId]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      alert("File too large. Please upload under 50MB.");
      return;
    }

    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setStatus('idle');
    setSubtitles([]);
    setProgress(0);
  };

  const startAnalysis = async () => {
    if (!videoFile) return;

    try {
      setStatus('uploading');
      setProgress(10);

      // Convert file to Base64
      const reader = new FileReader();
      reader.readAsDataURL(videoFile);
      
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        const base64Content = base64Data.split(',')[1];

        setStatus('transcribing');
        setProgress(30);

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // Updated Strict Prompt
        const prompt = `You are an expert Hindi audio-to-text transcription system with maximum accuracy.
Listen to the audio in the uploaded video and transcribe the lyrics PERFECTLY exactly as spoken without making ANY changes.

Strict Rules:
1. Do NOT guess any word.
2. Do NOT replace similar-sounding words.
3. Do NOT interpret or correct — only transcribe EXACTLY what is spoken.
4. Do NOT use synonyms or autocorrect.
5. Maintain 100% phonetic accuracy — match the exact sound of each word.
6. If audio is unclear, re-analyze that segment and match phonetics precisely.
7. Keep lyrics clean, line-by-line. No extra text.
8. Always distinguish correctly between similar words: (e.g., mandir vs mann se, maa vs main, dar vs dil).
9. ZERO hallucination — if unsure about any word, listen again and transcribe ONLY what is clearly spoken.
10. Output only pure Hindi lyrics EXACTLY as spoken in the audio.
11. If two words sound similar, analyze the consonant and vowel shape and select the exact audio phonetic.

Return a JSON object with this schema:
{
  "subtitles": [
    { "id": 1, "text": "First line of lyrics", "start": 0.0, "end": 2.5 },
    { "id": 2, "text": "Second line", "start": 2.6, "end": 5.0 }
  ]
}
ENSURE TIMESTAMPS ARE EXTREMELY ACCURATE TO THE MILLISECOND.`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            {
              inlineData: {
                mimeType: videoFile.type,
                data: base64Content
              }
            },
            { text: prompt }
          ],
          config: {
            responseMimeType: "application/json",
            systemInstruction: "Disable all predictive autocorrections. Disable synonyms. Disable sentence reconstruction. Enable phonetic matching only. System must strictly avoid hallucination. If uncertain about a word, re-check waveform before output. Never change meaning or guess.",
            temperature: 0.1, // Low temperature for higher accuracy
          }
        });

        setStatus('completed');
        setProgress(100);

        try {
            const text = response.text;
            if (text) {
                const json = JSON.parse(text);
                if (json.subtitles) {
                    setSubtitles(json.subtitles);
                }
            }
        } catch (e) {
            console.error("Failed to parse JSON", e);
            alert("Failed to generate subtitles. Please try again.");
            setStatus('error');
        }
      };

    } catch (error) {
      console.error(error);
      setStatus('error');
      alert("An error occurred during analysis.");
    }
  };

  // --- Subtitle Editing Functions ---

  const updateSubtitle = (id: number, field: keyof Subtitle, value: string | number) => {
    setSubtitles(prev => prev.map(sub => 
      sub.id === id ? { ...sub, [field]: value } : sub
    ));
  };

  const deleteSubtitle = (id: number) => {
    setSubtitles(prev => prev.filter(sub => sub.id !== id));
  };

  const addSubtitle = () => {
    const newId = subtitles.length > 0 ? Math.max(...subtitles.map(s => s.id)) + 1 : 1;
    // Default to adding after the last one or at 0 if empty
    const lastSub = subtitles[subtitles.length - 1];
    const startTime = lastSub ? lastSub.end + 0.1 : 0;
    
    setSubtitles([...subtitles, {
      id: newId,
      text: "New Lyric Line",
      start: parseFloat(startTime.toFixed(2)),
      end: parseFloat((startTime + 2.0).toFixed(2))
    }]);
  };

  const seekTo = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      videoRef.current.play();
    }
  };


  // --- Rendering Logic ---

  const drawFrame = (now: number, metadata: VideoFrameCallbackMetadata) => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
       video.requestVideoFrameCallback(drawFrame);
    }
  };

  // High-frequency loop for smooth preview updates
  useEffect(() => {
    let animationFrameId: number;
    
    const loop = () => {
      if (videoRef.current && !videoRef.current.paused) {
         setPlaybackTime(videoRef.current.currentTime);
      }
      animationFrameId = requestAnimationFrame(loop);
    };
    
    if (isPlaying) {
      loop();
    }
    
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying]);

  const [playbackTime, setPlaybackTime] = useState(0);

  // --- Export Logic ---

  const exportVideo = async () => {
    if (!videoRef.current || !canvasRef.current || !videoUrl) return;
    
    setIsExporting(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false }); // Optimisation: No transparency
    if (!ctx) return;

    // 1. Setup Canvas Size based on Config
    let targetWidth = video.videoWidth;
    let targetHeight = video.videoHeight;

    if (exportConfig.resolution === '1080p') {
      const aspect = video.videoWidth / video.videoHeight;
      targetWidth = 1080;
      targetHeight = 1080 / aspect;
    } else if (exportConfig.resolution === '720p') {
      const aspect = video.videoWidth / video.videoHeight;
      targetWidth = 720;
      targetHeight = 720 / aspect;
    }
    
    // Ensure even dimensions for some encoders
    targetWidth = Math.floor(targetWidth / 2) * 2;
    targetHeight = Math.floor(targetHeight / 2) * 2;

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    // 2. Setup Recording Stream
    // Capture the original audio track
    const audioContext = new AudioContext();
    const sourceNode = audioContext.createMediaElementSource(video);
    const destNode = audioContext.createMediaStreamDestination();
    sourceNode.connect(destNode);
    sourceNode.connect(audioContext.destination); // Play locally too so user hears it? Optional.
    
    const canvasStream = canvas.captureStream(60); // 60 FPS target
    const audioTrack = destNode.stream.getAudioTracks()[0];
    
    if (audioTrack) {
        canvasStream.addTrack(audioTrack);
        console.log("Audio track added to export stream");
    } else {
        console.warn("No audio track found on source video");
    }

    // 3. Determine Codec (Prioritizing AAC/H.264)
    const mimeTypes = [
      'video/mp4; codecs="avc1.4d402a, mp4a.40.2"', // H.264 High Profile L4.2 + AAC (Best for HD)
      'video/mp4; codecs="avc1.64002a, mp4a.40.2"', // H.264 High Profile
      'video/mp4; codecs="avc1.42E01E, mp4a.40.2"', // H.264 Baseline (Most compatible)
      'video/mp4',                                  // Generic MP4
      'video/webm; codecs=h264',
      'video/webm; codecs=vp9',
      'video/webm'
    ];
    
    let selectedMimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || 'video/webm';
    console.log(`Exporting using: ${selectedMimeType}`);

    // Bitrate based on quality
    let videoBits = 5000000; // 5 Mbps default (High)
    if (exportConfig.quality === 'medium') videoBits = 2500000; // 2.5 Mbps
    if (exportConfig.quality === 'low') videoBits = 1000000;    // 1 Mbps
    
    // Audio bitrate: 128kbps AAC
    const recorderOptions: MediaRecorderOptions = {
        mimeType: selectedMimeType,
        videoBitsPerSecond: videoBits,
        audioBitsPerSecond: 128000 
    };

    let recorder: MediaRecorder;
    try {
        recorder = new MediaRecorder(canvasStream, recorderOptions);
    } catch (e) {
        console.error("MediaRecorder init failed, falling back to default", e);
        recorder = new MediaRecorder(canvasStream);
    }

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: selectedMimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Determine extension
      const ext = selectedMimeType.includes('mp4') ? 'mp4' : 'webm';
      a.download = `autolyrics_export.${ext}`;
      a.click();
      setIsExporting(false);
      
      // Cleanup
      audioContext.close();
      video.removeEventListener('ended', stopRecording);
      if (requestRef.current) video.cancelVideoFrameCallback(requestRef.current);
      
      // Reset UI state
      video.currentTime = 0;
    };

    // 4. Render Loop (Sync)
    const renderFrame = (now: number, metadata: VideoFrameCallbackMetadata) => {
       if (!ctx || !video) return;
       
       // Draw Video
       ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
       
       // Find Subtitle
       // Calculate current time with sync offset
       const t = metadata.mediaTime + syncOffset;
       
       const currentSub = subtitles.find(s => t >= s.start && t <= s.end);
       
       if (currentSub) {
          // --- Text Rendering Logic ---
          // Font setup
          const relScale = targetWidth / 1080; // Reference width 1080px
          const fontSize = customStyle.fontSize * relScale;
          
          ctx.font = `${customStyle.fontWeight} ${fontSize}px ${customStyle.fontFamily.split(',')[0]}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          const centerX = targetWidth / 2;
          const posY = (customStyle.positionY / 100) * targetHeight;
          
          // Background (if any)
          if (customStyle.background) {
             const metrics = ctx.measureText(currentSub.text);
             const padding = 20 * relScale;
             const bgHeight = fontSize * 1.4;
             const bgWidth = metrics.width + (padding * 2);
             
             ctx.fillStyle = customStyle.background;
             ctx.fillRect(centerX - bgWidth/2, posY - bgHeight/2, bgWidth, bgHeight);
          }
          
          // Shadow
          if (customStyle.shadow && customStyle.shadow !== 'none') {
             // Parse simple shadows (approximation) or just strict multiple fills
             // Canvas shadow support is basic compared to CSS box-shadow
             // We will implement a simple drop shadow based on the first part of the string
             ctx.shadowColor = 'rgba(0,0,0,0.5)';
             ctx.shadowBlur = 4 * relScale;
             ctx.shadowOffsetX = 2 * relScale;
             ctx.shadowOffsetY = 2 * relScale;
          } else {
             ctx.shadowColor = 'transparent';
          }
          
          // Stroke / Outline
          if (customStyle.outlineWidth > 0) {
             ctx.strokeStyle = customStyle.outlineColor;
             ctx.lineWidth = customStyle.outlineWidth * 2 * relScale; // Canvas stroke is centered
             ctx.strokeText(currentSub.text, centerX, posY);
          }
          
          // Fill
          ctx.fillStyle = customStyle.color;
          ctx.shadowColor = 'transparent'; // Reset shadow for fill if wanted sharp
          ctx.fillText(currentSub.text, centerX, posY);
       }
       
       requestRef.current = video.requestVideoFrameCallback(renderFrame);
    };

    // 5. Start Process
    const stopRecording = () => {
        if (recorder.state === 'recording') recorder.stop();
    };

    video.addEventListener('ended', stopRecording);
    
    // Kickstart
    video.currentTime = 0;
    video.volume = 1.0; // Ensure audio is capturing
    video.muted = false; // Must be unmuted to capture stream
    
    // Wait a tick for seek
    await new Promise(r => setTimeout(r, 200));
    
    // Start drawing
    requestRef.current = video.requestVideoFrameCallback(renderFrame);
    recorder.start();
    video.play();
  };

  // Helper to get active subtitle for Preview
  const getActiveSubtitle = () => {
     const t = playbackTime + syncOffset;
     return subtitles.find(s => t >= s.start && t <= s.end);
  };

  const activeSub = getActiveSubtitle();

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 bg-slate-900 text-slate-100">
      
      {/* Header */}
      <header className="w-full max-w-4xl flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
           <Music className="w-8 h-8 text-pink-500" />
           <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500">
             AutoLyrics Hindi
           </h1>
        </div>
        <div className="text-xs text-slate-400 border border-slate-700 px-3 py-1 rounded-full">
           v2.1 • AI-Powered
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Editor & Preview */}
        <div className="lg:col-span-2 flex flex-col gap-6">
           
           {/* Upload Zone (if no video) */}
           {!videoUrl && (
             <div 
               onClick={() => fileInputRef.current?.click()}
               className="border-2 border-dashed border-slate-700 hover:border-pink-500 transition-colors rounded-2xl h-96 flex flex-col items-center justify-center cursor-pointer bg-slate-800/50 group"
             >
               <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleFileUpload} />
               <div className="p-4 bg-slate-800 rounded-full mb-4 group-hover:scale-110 transition-transform">
                 <Upload className="w-8 h-8 text-slate-400 group-hover:text-pink-400" />
               </div>
               <p className="text-lg font-medium text-slate-300">Upload Reel or Short</p>
               <p className="text-sm text-slate-500 mt-2">Max 60 seconds • MP4, MOV</p>
             </div>
           )}

           {/* Video Preview Player */}
           {videoUrl && (
             <div className="relative w-full aspect-[9/16] bg-black rounded-xl overflow-hidden shadow-2xl mx-auto max-w-[400px] border border-slate-800" style={{ containerType: 'size' }}>
                
                {/* The Video */}
                <video 
                   ref={videoRef}
                   src={videoUrl}
                   controls // ADDED CONTROLS FOR PREVIEW
                   className={`w-full h-full object-cover ${isExporting ? 'pointer-events-none' : ''}`}
                   playsInline
                   onPlay={() => setIsPlaying(true)}
                   onPause={() => setIsPlaying(false)}
                   onEnded={() => setIsPlaying(false)}
                   onLoadedMetadata={(e) => setVideoDuration(e.currentTarget.duration)}
                />

                {/* Subtitle Overlay (Preview) */}
                {activeSub && !isExporting && (
                  <div 
                    className="absolute w-full flex justify-center px-4 pointer-events-none"
                    style={{ 
                      top: `${customStyle.positionY}%`,
                      transform: 'translateY(-50%)',
                      textAlign: 'center'
                    }}
                  >
                     <p style={{
                        fontFamily: customStyle.fontFamily,
                        fontSize: `${customStyle.fontSize / 10.8}cqw`, // Responsive to container width (1080px ref)
                        color: customStyle.color,
                        fontWeight: customStyle.fontWeight,
                        WebkitTextStroke: `${customStyle.outlineWidth / 10.8}cqw ${customStyle.outlineColor}`,
                        textShadow: customStyle.shadow,
                        backgroundColor: customStyle.background || 'transparent',
                        padding: customStyle.background ? '0.2em 0.5em' : '0',
                        borderRadius: '0.2em'
                     }}
                     className={`transition-all duration-200 ${customStyle.animation === 'pop' ? 'animate-[bounce_0.5s]' : ''}`}
                     >
                       {activeSub.text}
                     </p>
                  </div>
                )}
                
                {/* Exporting Overlay */}
                {isExporting && (
                   <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50">
                      <Loader2 className="w-10 h-10 text-pink-500 animate-spin mb-2" />
                      <p className="text-white font-medium">Rendering Video...</p>
                      <p className="text-xs text-slate-400">Please do not close tab</p>
                   </div>
                )}
             </div>
           )}

           {/* Hidden Canvas for Rendering */}
           <canvas ref={canvasRef} className="fixed -top-[9999px] -left-[9999px] pointer-events-none" />
           
        </div>

        {/* Right Column: Controls */}
        <div className="flex flex-col gap-4 h-full">
           
           {/* Status Card */}
           <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                 <Wand2 className="w-5 h-5 text-purple-400" />
                 AI Actions
              </h2>
              
              {status === 'idle' && (
                 <button 
                   onClick={startAnalysis}
                   disabled={!videoFile}
                   className="w-full py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                 >
                   <Wand2 className="w-4 h-4" /> Generate Lyrics
                 </button>
              )}

              {status !== 'idle' && status !== 'completed' && status !== 'error' && (
                 <div className="space-y-3">
                    <div className="flex justify-between text-sm text-slate-400">
                       <span className="capitalize">{status}...</span>
                       <span>{progress}%</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-pink-500 transition-all duration-500" 
                         style={{ width: `${progress}%` }}
                       />
                    </div>
                 </div>
              )}
              
              {status === 'completed' && (
                 <div className="flex items-center gap-2 text-green-400 bg-green-400/10 p-3 rounded-lg border border-green-400/20">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">Lyrics Generated!</span>
                 </div>
              )}
           </div>

           {/* MAIN TAB SWITCHER */}
           {status === 'completed' && (
             <div className="flex gap-2 p-1 bg-slate-800 rounded-lg border border-slate-700">
                <button 
                  onClick={() => setActiveTab('design')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-all ${activeTab === 'design' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <Palette className="w-4 h-4" /> Design
                </button>
                <button 
                  onClick={() => setActiveTab('lyrics')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-all ${activeTab === 'lyrics' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <Type className="w-4 h-4" /> Edit Lyrics
                </button>
             </div>
           )}

           {/* -------------------- TAB CONTENT: DESIGN -------------------- */}
           {status === 'completed' && activeTab === 'design' && (
             <>
               {/* Sync & Adjustments */}
               <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                 <button 
                   onClick={() => setShowSettingsPanel(!showSettingsPanel)}
                   className="w-full flex items-center justify-between text-left font-semibold text-slate-200 mb-2"
                 >
                   <span className="flex items-center gap-2"><Sliders className="w-4 h-4 text-blue-400"/> Timing & Sync</span>
                   {showSettingsPanel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                 </button>
                 
                 {showSettingsPanel && (
                   <div className="mt-4 space-y-4">
                      <div className="space-y-2">
                         <div className="flex justify-between text-xs text-slate-400">
                            <span>Offset (Early/Late)</span>
                            <span className={syncOffset !== 0 ? 'text-yellow-400' : ''}>{syncOffset > 0 ? '+' : ''}{syncOffset.toFixed(2)}s</span>
                         </div>
                         <div className="flex items-center gap-3">
                           <RotateCcw className="w-4 h-4 text-slate-500 cursor-pointer hover:text-white" onClick={() => setSyncOffset(0)} />
                           <input 
                             type="range" 
                             min="-2.0" 
                             max="2.0" 
                             step="0.05"
                             value={syncOffset}
                             onChange={(e) => setSyncOffset(parseFloat(e.target.value))}
                             className="w-full accent-blue-500 h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                           />
                         </div>
                         <p className="text-[10px] text-slate-500">
                           Global offset for all lines.
                         </p>
                      </div>
                   </div>
                 )}
               </div>

               {/* Style Customization */}
               <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 flex-1 flex flex-col min-h-[400px]">
                 
                 {/* Style Presets Grid */}
                 <div className="grid grid-cols-3 gap-2 mb-6 overflow-y-auto max-h-[200px] pr-2">
                    {STYLES.map(style => (
                      <button
                        key={style.id}
                        onClick={() => setCurrentStyleId(style.id)}
                        className={`p-2 rounded-lg text-xs font-medium transition-all text-center border ${
                          currentStyleId === style.id 
                            ? 'bg-pink-600 border-pink-500 text-white' 
                            : 'bg-slate-700 border-transparent text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {style.name}
                      </button>
                    ))}
                 </div>

                 {/* Fine Tuning */}
                 <div className="space-y-5 border-t border-slate-700 pt-5">
                    
                    {/* Font Family */}
                    <div className="space-y-1">
                       <label className="text-xs text-slate-400">Font</label>
                       <div className="relative">
                         <select 
                           value={customStyle.fontFamily}
                           onChange={(e) => setCustomStyle({...customStyle, fontFamily: e.target.value})}
                           className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white appearance-none focus:border-pink-500 outline-none"
                         >
                           {FONT_OPTIONS.map(font => (
                             <option key={font.name} value={font.value}>{font.name}</option>
                           ))}
                         </select>
                         <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                       </div>
                    </div>

                    {/* Font Size */}
                    <div className="space-y-1">
                       <div className="flex justify-between text-xs text-slate-400">
                          <span>Size</span>
                          <span>{customStyle.fontSize}px</span>
                       </div>
                       <input 
                         type="range" 
                         min="20" 
                         max="120" 
                         value={customStyle.fontSize}
                         onChange={(e) => setCustomStyle({...customStyle, fontSize: parseInt(e.target.value)})}
                         className="w-full accent-pink-500 h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                       />
                    </div>

                    {/* Position Y */}
                    <div className="space-y-1">
                       <div className="flex justify-between text-xs text-slate-400">
                          <span>Vertical Position</span>
                          <span>{customStyle.positionY}%</span>
                       </div>
                       <input 
                         type="range" 
                         min="10" 
                         max="90" 
                         value={customStyle.positionY}
                         onChange={(e) => setCustomStyle({...customStyle, positionY: parseInt(e.target.value)})}
                         className="w-full accent-pink-500 h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                       />
                    </div>

                    {/* Colors */}
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1">
                          <label className="text-xs text-slate-400">Text Color</label>
                          <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-lg border border-slate-600">
                             <input 
                               type="color" 
                               value={customStyle.color}
                               onChange={(e) => setCustomStyle({...customStyle, color: e.target.value})}
                               className="w-8 h-8 rounded cursor-pointer bg-transparent border-none"
                             />
                             <span className="text-xs uppercase">{customStyle.color}</span>
                          </div>
                       </div>
                       <div className="space-y-1">
                          <label className="text-xs text-slate-400">Outline</label>
                          <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-lg border border-slate-600">
                             <input 
                               type="color" 
                               value={customStyle.outlineColor}
                               onChange={(e) => setCustomStyle({...customStyle, outlineColor: e.target.value})}
                               className="w-8 h-8 rounded cursor-pointer bg-transparent border-none"
                             />
                             <input 
                               type="number"
                               min="0"
                               max="10"
                               value={customStyle.outlineWidth}
                               onChange={(e) => setCustomStyle({...customStyle, outlineWidth: parseInt(e.target.value)})}
                               className="w-10 bg-transparent text-xs text-center outline-none"
                             />
                          </div>
                       </div>
                    </div>
                 </div>
               </div>
             </>
           )}

           {/* -------------------- TAB CONTENT: LYRICS EDITOR -------------------- */}
           {status === 'completed' && activeTab === 'lyrics' && (
             <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 flex-1 flex flex-col h-[500px]">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-slate-200">Subtitle Lines</h3>
                  <button onClick={addSubtitle} className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-md flex items-center gap-1">
                     <Plus className="w-3 h-3" /> Add Line
                  </button>
               </div>
               
               <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                  {subtitles.length === 0 && (
                     <div className="text-center text-slate-500 py-10">
                        No subtitles yet. Add one or generate AI lyrics.
                     </div>
                  )}
                  {subtitles.map((sub, index) => (
                    <div key={sub.id} className="bg-slate-900/50 border border-slate-700 rounded-lg p-3 hover:border-slate-600 transition-colors">
                      {/* Top Row: Time Controls & Play */}
                      <div className="flex items-center gap-2 mb-2">
                        <button 
                          onClick={() => seekTo(sub.start)}
                          className="p-1.5 text-pink-400 hover:bg-pink-400/10 rounded-full transition-colors"
                          title="Play from this line"
                        >
                          <PlayCircle className="w-4 h-4" />
                        </button>
                        
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                           <input 
                             type="number" 
                             step="0.1" 
                             value={sub.start} 
                             onChange={(e) => updateSubtitle(sub.id, 'start', parseFloat(e.target.value))}
                             className="bg-slate-800 w-14 px-1 py-0.5 rounded border border-slate-700 text-center"
                           />
                           <span>→</span>
                           <input 
                             type="number" 
                             step="0.1" 
                             value={sub.end} 
                             onChange={(e) => updateSubtitle(sub.id, 'end', parseFloat(e.target.value))}
                             className="bg-slate-800 w-14 px-1 py-0.5 rounded border border-slate-700 text-center"
                           />
                           <span className="text-[10px] text-slate-600">sec</span>
                        </div>
                        
                        <div className="ml-auto">
                           <button 
                             onClick={() => deleteSubtitle(sub.id)}
                             className="text-slate-600 hover:text-red-400 p-1"
                             title="Delete Line"
                           >
                             <Trash2 className="w-3.5 h-3.5" />
                           </button>
                        </div>
                      </div>
                      
                      {/* Text Area */}
                      <textarea
                        value={sub.text}
                        onChange={(e) => updateSubtitle(sub.id, 'text', e.target.value)}
                        className="w-full bg-slate-800 border-none rounded-md px-3 py-2 text-sm text-slate-200 focus:ring-1 focus:ring-pink-500 outline-none resize-none font-hindi"
                        rows={2}
                      />
                    </div>
                  ))}
               </div>
             </div>
           )}

           {/* Export Section */}
           {status === 'completed' && (
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mt-auto">
                 <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Download className="w-5 h-5 text-green-400" />
                    Export
                 </h2>
                 
                 <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="space-y-1">
                       <label className="text-xs text-slate-400">Resolution</label>
                       <select 
                         value={exportConfig.resolution}
                         onChange={(e) => setExportConfig({...exportConfig, resolution: e.target.value as any})}
                         className="w-full bg-slate-900 border border-slate-600 rounded-lg px-2 py-2 text-xs text-white"
                       >
                          <option value="original">Original</option>
                          <option value="1080p">1080p (HD)</option>
                          <option value="720p">720p</option>
                       </select>
                    </div>
                    <div className="space-y-1">
                       <label className="text-xs text-slate-400">Quality</label>
                       <select 
                         value={exportConfig.quality}
                         onChange={(e) => setExportConfig({...exportConfig, quality: e.target.value as any})}
                         className="w-full bg-slate-900 border border-slate-600 rounded-lg px-2 py-2 text-xs text-white"
                       >
                          <option value="high">High (5 Mbps)</option>
                          <option value="medium">Medium (2.5 Mbps)</option>
                          <option value="low">Low (1 Mbps)</option>
                       </select>
                    </div>
                 </div>

                 <button 
                   onClick={exportVideo}
                   disabled={isExporting}
                   className="w-full py-3 bg-green-600 hover:bg-green-500 rounded-lg font-bold text-white transition-all shadow-lg shadow-green-900/50 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   {isExporting ? (
                     <><Loader2 className="w-5 h-5 animate-spin" /> Rendering...</>
                   ) : (
                     <><VideoIcon className="w-5 h-5" /> Download Reel</>
                   )}
                 </button>
              </div>
           )}

        </div>
      </main>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);