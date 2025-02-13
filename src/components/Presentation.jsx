import React, { useState, useEffect, useRef } from 'react';
import CircleVisualizer from './CircleVisualizer';

const slides = [
  { id: 0, speaker: 'pitcher', imgSrc: '/image/cover-pitch.png', circlevisible: false },
  { id: 0, speaker: 'pitcher', imgSrc: '/image/cover-pitch.png', circlevisible: true },
  { id: 1, speaker: 'ai', audioSrc: '/audio/pitch-1.wav', imgSrc:'/image/base-slide-deck.png', forceCenter: true, circlevisible: true },
  { id: 2, speaker: 'ai', videoSrc: '/video/Pitch-2.mp4', circlevisible: true },
  { id: 3, speaker: 'ai', videoSrc: '/video/Pitch-3_2.mp4', circlevisible: true }, 
  { id: 4, speaker: 'pitcher', imgSrc: '/image/problem-slide-deck.png', circlevisible: false },
  { id: 5, speaker: 'pitcher', imgSrc: '/image/solution-slide-deck.png', circlevisible: false },
  { id: 6, speaker: 'ai', imgSrc: '/image/solution-slide-deck.png', audioSrc: '/audio/pitch-4.wav', circlevisible: true },
  { id: 7, speaker: 'ai', audioSrc: '/audio/pitch-5.mp3', imgSrc: '/image/base-slide-deck.png', forceCenter: true, circlevisible: true },
  { id: 8, speaker: 'pitcher', imgSrc: '/image/business-model-slide-deck.png', circlevisible: true },
  { id: 9, speaker: 'ai', videoSrc: '/video/Pitch-6.mp4', circlevisible: true },
  { id: 10, speaker: 'pitcher', imgSrc: '/image/team-slide-deck.png', circlevisible: false},
  { id: 11, speaker: 'pitcher', imgSrc: '/image/investments-slide-deck.png', circlevisible: false },
  { id: 12, speaker: 'pitcher', imgSrc: '/image/billing-slide-deck.png', circlevisible: false },
  { id: 13, speaker: 'pitcher', imgSrc: '/image/customer-service-law-slide-deck.png', circlevisible: false },
  { id: 14, speaker: 'pitcher', imgSrc: '/image/customer-service-law-slide-deck.png', circlevisible: true },
  { id: 15, speaker: 'ai', audioSrc: '/audio/pitch-7.mp3', imgSrc: '/image/base-slide-deck.png', forceCenter:true, circlevisible: true },
  { id: 16, speaker: 'ai', videoSrc: '/video/Pitch-8.mp4', circlevisible: true },
  { id: 17, speaker: 'end', videoSrc: '/video/Pitch-9.mp4', circlevisible: false }
];

const Presentation = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [amplitude, setAmplitude] = useState(0);
  const [activeMode, setActiveMode] = useState('mic'); // 'mic' or 'speaker'
  
  const audioRef = useRef(null);
  const videoRef = useRef(null);
  const imageRef = useRef(null);
  
  const audioContextRef = useRef(null);
  const micAnalyserRef = useRef(null);
  const speakerAnalyserRef = useRef(null);
  // NEW: refs to store the MediaElementSource for video and audio.
  const videoSourceRef = useRef(null);
  const audioSourceRef = useRef(null);
  
  const animationFrameIdRef = useRef(null);

  // Setup AudioContext and mic analyser on mount.
  useEffect(() => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;
    
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        if (audioContext.state === 'suspended') {
          audioContext.resume().then(() => {
            console.log('AudioContext resumed after getUserMedia');
          });
        }
        const micSource = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        micSource.connect(analyser);
        micAnalyserRef.current = analyser;
      })
      .catch(error => console.error('Error accessing microphone:', error));

    return () => {
      audioContext.close();
    };
  }, []);

  // Amplitude animation loop.
  useEffect(() => {
    function updateAmplitude() {
      let analyser;
      const audioPlaying = audioRef.current && !audioRef.current.paused;
      const videoPlaying = videoRef.current && !videoRef.current.paused;
      
      if (audioPlaying || videoPlaying) {
        analyser = speakerAnalyserRef.current;
        if (activeMode !== 'speaker') setActiveMode('speaker');
      } else {
        analyser = micAnalyserRef.current;
        if (activeMode !== 'mic') setActiveMode('mic');
      }
      
      if (analyser) {
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteTimeDomainData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          let value = dataArray[i] - 128;
          sum += value * value;
        }
        const rms = Math.sqrt(sum / dataArray.length);
        const norm = Math.min(rms / 128, 1);
        setAmplitude(norm);
      }
      
      animationFrameIdRef.current = requestAnimationFrame(updateAmplitude);
    }
    
    animationFrameIdRef.current = requestAnimationFrame(updateAmplitude);
    return () => cancelAnimationFrame(animationFrameIdRef.current);
  }, [activeMode]);

  // Create MediaElementSource and resume AudioContext on user play for audio.
  const handleAudioPlay = () => {
    console.log('Audio play requested.');
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().then(() => {
        console.log('AudioContext resumed:', audioContextRef.current.state);
      }).catch(err => console.error('AudioContext resume error:', err));
    }
    
    if (!speakerAnalyserRef.current && audioContextRef.current && audioRef.current) {
      try {
        let source;
        if (!audioSourceRef.current) {
          audioSourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
        }
        source = audioSourceRef.current;
        const analyser = audioContextRef.current.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyser.connect(audioContextRef.current.destination);
        speakerAnalyserRef.current = analyser;
        console.log('MediaElementSource and analyser created for audio.');
      } catch (error) {
        console.error('Error setting up speaker analyser for audio:', error);
      }
    }
  };

  // Create MediaElementSource and resume AudioContext on user play for video.
  const handleVideoPlay = () => {
    console.log('Video play requested.');
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().then(() => {
        console.log('AudioContext resumed:', audioContextRef.current.state);
      }).catch(err => console.error('AudioContext resume error:', err));
    }
    
    if (videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.volume = 1;
    }
    
    // Use the stored videoSourceRef if already created.
    if (!speakerAnalyserRef.current && audioContextRef.current && videoRef.current) {
      try {
        let source;
        if (!videoSourceRef.current) {
          videoSourceRef.current = audioContextRef.current.createMediaElementSource(videoRef.current);
        }
        source = videoSourceRef.current;
        const analyser = audioContextRef.current.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyser.connect(audioContextRef.current.destination);
        speakerAnalyserRef.current = analyser;
        console.log('MediaElementSource and analyser created for video.');
      } catch (error) {
        console.error('Error setting up speaker analyser for video:', error);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        nextSlide();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide]);

  function nextSlide() {
    setCurrentSlide(prev => {
      const next = prev + 1;
      return next < slides.length ? next : 0;
    });
  }

  // Update media based on slide changes.
  useEffect(() => {
    if (speakerAnalyserRef.current) {
      try {
        speakerAnalyserRef.current.disconnect();
      } catch (err) {
        console.error('Error disconnecting speaker analyser:', err);
      }
      speakerAnalyserRef.current = null;
    }
    
    const slide = slides[currentSlide];
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      videoRef.current.style.display = 'none';
    }
    if (imageRef.current) {
      imageRef.current.src = '';
      imageRef.current.style.display = 'none';
    }
    
    // Play audio if provided.
    if (slide.audioSrc && audioRef.current) {
      audioRef.current.src = slide.audioSrc;
      audioRef.current.load();
      audioRef.current.play()
        .then(() => console.log('AI Audio playing.'))
        .catch(error => console.error('AI Audio play error:', error));
    }
    // Play video if provided.
    if (slide.videoSrc && videoRef.current) {
      videoRef.current.src = slide.videoSrc;
      videoRef.current.style.display = 'block';
      videoRef.current.play()
        .catch(error => console.error('Video play error:', error));
    }
    // Show image if provided (regardless of speaker).
    if (slide.imgSrc && imageRef.current) {
      imageRef.current.src = slide.imgSrc;
      imageRef.current.style.display = 'block';
    }
  }, [currentSlide]);

  return (
    <div
      className="presentation-container"
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        background: '#fdfdfd',
        overflow: 'hidden'
      }}
    >
      {slides[currentSlide].circlevisible !== false && (
        <CircleVisualizer
          amplitude={amplitude}
          activeMode={activeMode}
          mediaVisible={!!(slides[currentSlide].videoSrc || slides[currentSlide].imgSrc)}
          forceCenter={slides[currentSlide].forceCenter} // New option to force the circle in the center.
          final={slides[currentSlide].final}
        />
      )}
      
      <audio
        ref={audioRef}
        style={{ display: "none" }}
        onPlay={handleAudioPlay}
        onError={(e) => {
          console.error('Audio element error:', e);
          const error = e.target.error;
          if (error) {
            switch (error.code) {
              case error.MEDIA_ERR_ABORTED:
                console.error('Media playback aborted.');
                break;
              case error.MEDIA_ERR_NETWORK:
                console.error('Network error.');
                break;
              case error.MEDIA_ERR_DECODE:
                console.error('Media decoding failed.');
                break;
              case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                console.error('Media source not supported.');
                break;
              default:
                console.error('Unknown error.');
            }
          }
        }}
        onEnded={() => setActiveMode('mic')}
      />
      
      <video
        ref={videoRef}
        muted={false}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          objectFit: 'cover',
          display: 'none'
        }}
        onPlay={handleVideoPlay}
        onEnded={() => setActiveMode('mic')}
      />
      
      <img
        ref={imageRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          objectFit: 'cover',
          display: 'none'
        }}
        alt="Slide content"
      />
      
      <button
        onClick={nextSlide}
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          zIndex: 10,
          padding: '10px 20px',
          fontSize: '16px',
          display: 'none'
        }}
      >
        Next Slide (PageUp)
      </button>
    </div>
  );
};

export default Presentation;