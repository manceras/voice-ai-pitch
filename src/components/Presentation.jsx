import React, { useState, useEffect, useRef } from 'react';
import CircleVisualizer from './CircleVisualizer';

// Updated slide deck with an image slide.
const slides = [
  { id: 1, speaker: 'pitcher' },
  { id: 2, speaker: 'ai', audioSrc: '/audio/clip1.mp3' },
  { id: 3, speaker: 'ai', audioSrc: '/audio/clip2.mp3', imgSrc: '/image/clip1.png' },
  { id: 4, speaker: 'ai', videoSrc: '/video/clip1.mp4', audioSrc: '/audio/clip3.mp3' },
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
  
  const animationFrameIdRef = useRef(null);

  // Setup AudioContext and mic analyser on mount.
  useEffect(() => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;
    
    // Request microphone access and set up the mic analyser.
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
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

  // Create MediaElementSource and resume AudioContext on user play.
  const handleAudioPlay = () => {
    console.log('Audio play requested.');
    
    // Ensure the AudioContext is resumed.
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().then(() => {
        console.log('AudioContext resumed:', audioContextRef.current.state);
      }).catch(err => console.error('AudioContext resume error:', err));
    }
    
    // Create the MediaElementSource and analyser only once.
    if (!speakerAnalyserRef.current && audioContextRef.current && audioRef.current) {
      try {
        const source = audioContextRef.current.createMediaElementSource(audioRef.current);
        const analyser = audioContextRef.current.createAnalyser();
        analyser.fftSize = 256;
        
        // Connect via the analyser.
        source.connect(analyser);
        analyser.connect(audioContextRef.current.destination);
        
        speakerAnalyserRef.current = analyser;
        console.log('MediaElementSource and analyser created.');
      } catch (error) {
        console.error('Error setting up speaker analyser:', error);
      }
    }
  };

  // Listen for the PageUp key to trigger next slide.
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'PageUp') {
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
    const slide = slides[currentSlide];
    
    // Reset media players.
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
    
    if (slide.speaker === 'ai') {
      if (slide.audioSrc && audioRef.current) {
        audioRef.current.src = slide.audioSrc;
        audioRef.current.load();
        audioRef.current.play()
          .then(() => console.log('AI Audio playing.'))
          .catch(error => console.error('AI Audio play error:', error));
      }
      
      // Prefer video if provided; otherwise, use an image if available.
      if (slide.videoSrc && videoRef.current) {
        videoRef.current.src = slide.videoSrc;
        videoRef.current.style.display = 'block';
        videoRef.current.play()
          .catch(error => console.error('Video play error:', error));
      } else if (slide.imgSrc && imageRef.current) {
        imageRef.current.src = slide.imgSrc;
        imageRef.current.style.display = 'block';
      }
    } else {
      // For the pitcher's slide, hide both video and image.
      if (videoRef.current) {
        videoRef.current.style.display = 'none';
      }
      if (imageRef.current) {
        imageRef.current.style.display = 'none';
      }
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
      <CircleVisualizer
				amplitude={amplitude}
				activeMode={activeMode}
				mediaVisible={
					slides[currentSlide].speaker === 'ai' &&
					(slides[currentSlide].videoSrc || slides[currentSlide].imgSrc)
				}
			/>
      
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
        style={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          width: '80%',
          display: 'none'
        }}
        onEnded={() => setActiveMode('mic')}
        muted
      />
      
      <img
        ref={imageRef}
        style={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          width: '80%',
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
          fontSize: '16px'
        }}
      >
        Next Slide (PageUp)
      </button>
    </div>
  );
};

export default Presentation;
