import React, { useState, useEffect } from 'react';
import elevenLabsTTS from '../services/elevenLabsTTS';
import { agentConfigs } from './ChatbotLauncher/agents/agentConfigs';
import { Mic, MicOff, Play, Pause, Volume2 } from 'lucide-react';

export const ElevenLabsTTSDemo: React.FC = () => {
  const [selectedAgent, setSelectedAgent] = useState('harvey');
  const [text, setText] = useState('Hello! I am ready to help you with your questions.');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [status, setStatus] = useState('Ready');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize TTS service
    elevenLabsTTS.initialize().catch((err) => {
      setError('Failed to initialize TTS service: ' + err.message);
    });

    // Set up event listeners
    const handleStreamStarted = () => {
      setStatus('Streaming...');
      setIsStreaming(true);
    };

    const handleStreamComplete = () => {
      setStatus('Stream complete');
      setIsStreaming(false);
    };

    const handlePlaybackStarted = () => {
      setIsPlaying(true);
    };

    const handlePlaybackStopped = () => {
      setIsPlaying(false);
    };

    const handleError = (error: any) => {
      setError(`TTS Error (${error.type}): ${error.error.message}`);
      setIsStreaming(false);
      setIsPlaying(false);
    };

    elevenLabsTTS.on('stream-started', handleStreamStarted);
    elevenLabsTTS.on('stream-complete', handleStreamComplete);
    elevenLabsTTS.on('playback-started', handlePlaybackStarted);
    elevenLabsTTS.on('playback-stopped', handlePlaybackStopped);
    elevenLabsTTS.on('error', handleError);

    return () => {
      elevenLabsTTS.off('stream-started', handleStreamStarted);
      elevenLabsTTS.off('stream-complete', handleStreamComplete);
      elevenLabsTTS.off('playback-started', handlePlaybackStarted);
      elevenLabsTTS.off('playback-stopped', handlePlaybackStopped);
      elevenLabsTTS.off('error', handleError);
    };
  }, []);

  const handleStreamText = async () => {
    try {
      setError(null);
      await elevenLabsTTS.streamTextToSpeech(text, selectedAgent);
    } catch (err: any) {
      setError('Stream error: ' + err.message);
    }
  };

  const handleGenerateSpeech = async () => {
    try {
      setError(null);
      setStatus('Generating speech...');
      const audioData = await elevenLabsTTS.generateSpeech(text, selectedAgent);
      setStatus('Playing...');
      await elevenLabsTTS.playAudio(audioData, 'mp3');
      setStatus('Complete');
    } catch (err: any) {
      setError('Generation error: ' + err.message);
    }
  };

  const handleStopPlayback = () => {
    elevenLabsTTS.stopPlayback();
    setStatus('Stopped');
  };

  const handleTogglePlayback = async () => {
    await elevenLabsTTS.togglePlayback();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    elevenLabsTTS.setVolume(newVolume);
  };

  const handleTestVoice = async () => {
    try {
      setError(null);
      setStatus('Testing voice...');
      await elevenLabsTTS.testAgentVoice(selectedAgent);
      setStatus('Voice test complete');
    } catch (err: any) {
      setError('Voice test error: ' + err.message);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">ElevenLabs TTS Service Demo</h2>

      {error && <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>}

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Select Agent Voice:</label>
        <select
          value={selectedAgent}
          onChange={(e) => setSelectedAgent(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          {Object.entries(agentConfigs).map(([id, config]) => (
            <option key={id} value={id}>
              {config.name} - {config.tagline}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Text to Speak:</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg h-32 focus:ring-2 focus:ring-blue-500"
          placeholder="Enter text to convert to speech..."
        />
      </div>

      <div className="mb-6 flex items-center space-x-4">
        <button
          onClick={handleStreamText}
          disabled={isStreaming || !text}
          className={`px-4 py-2 rounded-lg font-medium flex items-center space-x-2 ${
            isStreaming || !text
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <Mic className="w-4 h-4" />
          <span>Stream Text (WebSocket)</span>
        </button>

        <button
          onClick={handleGenerateSpeech}
          disabled={isStreaming || !text}
          className={`px-4 py-2 rounded-lg font-medium flex items-center space-x-2 ${
            isStreaming || !text
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          <Play className="w-4 h-4" />
          <span>Generate Speech (HTTP)</span>
        </button>

        <button
          onClick={handleStopPlayback}
          disabled={!isPlaying}
          className={`px-4 py-2 rounded-lg font-medium flex items-center space-x-2 ${
            !isPlaying
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-red-600 text-white hover:bg-red-700'
          }`}
        >
          <MicOff className="w-4 h-4" />
          <span>Stop</span>
        </button>

        <button
          onClick={handleTogglePlayback}
          className="px-4 py-2 rounded-lg font-medium bg-purple-600 text-white hover:bg-purple-700 flex items-center space-x-2"
        >
          <Pause className="w-4 h-4" />
          <span>Pause/Resume</span>
        </button>
      </div>

      <div className="mb-6 flex items-center space-x-4">
        <Volume2 className="w-5 h-5 text-gray-600" />
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={volume}
          onChange={handleVolumeChange}
          className="flex-1"
        />
        <span className="text-sm text-gray-600">{Math.round(volume * 100)}%</span>
      </div>

      <div className="mb-6">
        <button
          onClick={handleTestVoice}
          className="px-4 py-2 rounded-lg font-medium bg-indigo-600 text-white hover:bg-indigo-700"
        >
          Test Agent Voice
        </button>
      </div>

      <div className="p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold mb-2">Status:</h3>
        <p className="text-sm">{status}</p>
        <p className="text-sm text-gray-600 mt-1">
          Selected Voice: {agentConfigs[selectedAgent]?.voiceConfig.voiceId || 'Unknown'}
        </p>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">Integration with WebRTC:</h3>
        <code className="text-sm bg-white p-2 rounded block">
          {`// Example WebRTC integration
await elevenLabsTTS.connectToWebRTC(sessionId, agentId);
await elevenLabsTTS.processTextForWebRTC(text, sessionId, agentId);`}
        </code>
      </div>
    </div>
  );
};

export default ElevenLabsTTSDemo;
