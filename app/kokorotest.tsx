import React, { useEffect, useState, useRef, useCallback } from 'react'; // Add useRef and useCallback
import { View, Text, Button, StyleSheet, ScrollView, ActivityIndicator, Modal, SafeAreaView, TouchableOpacity, Dimensions, Pressable, FlatList } from 'react-native';
import { Stack } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import ttsService, { KOKORO_VOICES, SAMPLE_QUOTES } from '../services/ai/ttsService'; // Use new ttsService
import { Audio } from 'expo-av';

export default function KokoroTestScreen() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [selectedVoice, setSelectedVoice] = useState('narrator');
  const [selectedQuote, setSelectedQuote] = useState<keyof typeof SAMPLE_QUOTES>('short');
  // Remove state related to local models
  // const [modelsDownloaded, setModelsDownloaded] = useState(false);
  // const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  // const [downloadProgress, setDownloadProgress] = useState(0);
  // const [isDownloading, setIsDownloading] = useState(false);
  // Remove TTS metrics state (not provided by expo-speech/Google TTS easily)
  // const [ttsMetrics, setTtsMetrics] = useState<{...} | null>(null);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  // Remove model details state
  // const [modelDetails, setModelDetails] = useState<{ name: string, size: string }[]>([]);

  // Add log message to the state
  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
    console.log(`[KokoroTest] ${message}`);
  };

  // Initialize TTS Service
  useEffect(() => {
    let isMounted = true;
    
    const init = async () => {
      try {
        addLog('Initializing TTS Service...');
        setIsLoading(true);
        
        // Set up audio mode first
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          interruptionModeIOS: 1, // MixWithOthers
          interruptionModeAndroid: 2, // DuckOthers
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false
        });
        
        // Initialize TTS Service
        addLog('Starting TTS Service initialization...');
        const initialized = await ttsService.init();
        
        if (isMounted) {
          // Model checks are no longer needed
          // const modelStatus = await ttsService.checkModels();
          // setModelsDownloaded(modelStatus.allModelsExist);
          // setModelDetails(ttsService.getModelDetails());
          addLog(`TTS Service initialized successfully.`);
          setIsInitialized(initialized);
          setIsLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          addLog(`Error initializing TTS Service: ${error instanceof Error ? error.message : String(error)}`);
          // Still mark as initialized, but we'll use fallbacks
          setIsInitialized(true);
          setIsLoading(false);
        }
      }
    };

    init();
    
    return () => {
      isMounted = false;
      // Clean up
      ttsService.cleanup();
    };
  }, []);

  // Speak sample text
  const handleSpeak = async () => {
    try {
      const textToSpeak = SAMPLE_QUOTES[selectedQuote];
      addLog(`Speaking with voice: ${selectedVoice}, sample: ${selectedQuote}`);
      setIsLoading(true);
      
      // Use ttsService.speak with updated options
      await ttsService.speak(
        textToSpeak,
        {
          voice: selectedVoice, // Pass the desired voice name
          onStart: () => addLog('Speech started'),
          onDone: () => { // Use onDone
            addLog('Speech completed');
            setIsLoading(false);
          },
          onError: (error) => {
            addLog(`Speech error: ${error.message}`);
            setIsLoading(false);
          },
          // onProgress is not available
          rate: 1.0 // Use rate instead of speed
        }
      );
    } catch (error) {
      addLog(`Error in speak handler: ${error instanceof Error ? error.message : String(error)}`);
      setIsLoading(false);
    }
  };

  // Stop speaking
  const handleStop = async () => {
    try {
      addLog('Stopping speech');
      await ttsService.stop();
      addLog('Speech stopped');
      setIsLoading(false);
    } catch (error) {
      addLog(`Error stopping speech: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Remove handleDownloadModels function

  // Play remote sound
  const playRemoteSound = async () => {
    try {
      addLog('Playing remote sound');
      setIsLoading(true);
      
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://freesound.org/data/previews/80/80921_1022651-lq.mp3' },
        { volume: 1.0 },
        (status) => {
          // Updated status check for expo-av
          if (status.isLoaded) {
              if (status.didJustFinish) {
                  sound.unloadAsync();
                  addLog('Remote sound finished playing');
                  setIsLoading(false);
              }
          } else if (status.error) {
              addLog(`Remote sound playback error: ${status.error}`);
              setIsLoading(false);
          }
        }
      );
      
      await sound.playAsync();
    } catch (error) {
      addLog(`Error playing remote sound: ${error instanceof Error ? error.message : String(error)}`);
      setIsLoading(false);
    }
  };

  // Change voice
  const changeVoice = (voice: string) => {
    setSelectedVoice(voice);
    ttsService.setVoice(voice);
    addLog(`Voice changed to: ${voice}`);
  };

  // Select quote
  const selectQuote = (quote: keyof typeof SAMPLE_QUOTES) => {
    setSelectedQuote(quote);
    setShowQuoteModal(false);
    addLog(`Selected quote: ${quote}`);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "TTS Test (Google Cloud)" }} />
      
      <ScrollView style={styles.content}>
        <Text style={styles.header}>TTS Test (Google Cloud)</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status</Text>
          <Text>Initialized: {isInitialized ? '✅' : '❌'}</Text>
          {/* Remove Model Downloaded status */}
          {/* Remove Download button */}
          
          {/* Remove TTS Metrics */}
          {/* {ttsMetrics && (
            <View style={styles.metricsContainer}>
              <Text style={styles.metricsTitle}>Performance Metrics:</Text>
              <Text>Tokens per second: {ttsMetrics.tokensPerSecond.toFixed(2)}</Text>
              <Text>Time to first token: {ttsMetrics.timeToFirstToken}ms</Text>
            </View>
          )} */}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Voices</Text>
          <Text style={styles.voiceSelectionTitle}>Select a voice style:</Text>
          
          <TouchableOpacity 
            style={styles.voiceDropdown}
            onPress={() => setShowVoiceModal(true)}
          >
            <Text style={styles.selectedVoiceText}>{selectedVoice}</Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>
          
          <Text style={styles.voiceDescription}>
            {ttsService.getVoiceDescription(selectedVoice)}
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sample Text</Text>
          <TouchableOpacity 
            style={styles.sampleSelector}
            onPress={() => setShowQuoteModal(true)}
          >
            <Text style={styles.sampleSelectorLabel}>Selected Quote:</Text>
            <Text style={styles.sampleSelectorValue}>{selectedQuote}</Text>
            <Text style={styles.sampleSelectorArrow}>▼</Text>
          </TouchableOpacity>
          
          <View style={styles.samplePreview}>
            <Text style={styles.samplePreviewText} numberOfLines={3}>
              {SAMPLE_QUOTES[selectedQuote]}
            </Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <View style={styles.buttonContainer}>
            <Button 
              title="Speak Selected Sample" 
              onPress={handleSpeak}
              disabled={isLoading || !isInitialized} // Remove modelsDownloaded check
              color="#2196F3"
            />
            {/* Remove disabled text related to models */}
          </View>
          
          <View style={styles.buttonContainer}>
            <Button 
              title="Stop Speaking" 
              onPress={handleStop}
              disabled={!isLoading}
              color="#F44336"
            />
          </View>
          
          {/* Remove Test Tone Button */}
          
          <View style={styles.buttonContainer}>
            <Button 
              title="Play Remote Sound" 
              onPress={playRemoteSound}
              disabled={isLoading || !isInitialized}
              color="#673AB7"
            />
          </View>
        </View>
        
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={styles.loadingText}>Processing...</Text>
          </View>
        )}
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Logs</Text>
          <View style={styles.logsContainer}>
            {logs.map((log, index) => (
              <Text key={index} style={styles.logText}>
                {log}
              </Text>
            ))}
          </View>
        </View>
      </ScrollView>
      
      {/* Remove Download Modal */}
      
      {/* Quote Selection Modal */}
      <Modal
        visible={showQuoteModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowQuoteModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Sample Text</Text>
            
            <ScrollView style={styles.quoteList}>
              {Object.keys(SAMPLE_QUOTES).map((key) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.quoteItem, 
                    selectedQuote === key && styles.selectedQuoteItem
                  ]}
                  onPress={() => selectQuote(key as keyof typeof SAMPLE_QUOTES)}
                >
                  <Text style={styles.quoteItemLabel}>{key}</Text>
                  <Text style={styles.quoteItemPreview} numberOfLines={2}>
                    {SAMPLE_QUOTES[key as keyof typeof SAMPLE_QUOTES].substring(0, 60)}
                    {SAMPLE_QUOTES[key as keyof typeof SAMPLE_QUOTES].length > 60 ? '...' : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <TouchableOpacity 
              style={styles.closeQuoteButton}
              onPress={() => setShowQuoteModal(false)}
            >
              <Text style={styles.buttonTextWhite}>Close</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
      
      {/* Voice Selection Modal */}
      <Modal
        visible={showVoiceModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowVoiceModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Voice Style</Text>
            
            <FlatList
              data={Object.keys(KOKORO_VOICES)}
              keyExtractor={(item) => item}
              style={styles.voiceList}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={[
                    styles.voiceListItem,
                    selectedVoice === item && styles.selectedVoiceListItem
                  ]}
                  onPress={() => {
                    changeVoice(item);
                    setShowVoiceModal(false);
                  }}
                >
                  <Text style={[
                    styles.voiceListItemText,
                    selectedVoice === item && styles.selectedVoiceListItemText
                  ]}>
                    {item}
                  </Text>
                  <Text style={styles.voiceDescriptionSmall} numberOfLines={2}>
                    {ttsService.getVoiceDescription(item)}
                  </Text>
                </TouchableOpacity>
              )}
            />
            
            <TouchableOpacity 
              style={styles.closeModalButton}
              onPress={() => setShowVoiceModal(false)}
            >
              <Text style={styles.buttonTextWhite}>Close</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  buttonContainer: {
    marginBottom: 10,
    marginTop: 10,
  },
  voicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 8,
    marginBottom: 10,
  },
  voicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 8,
  },
  voiceButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    marginBottom: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  selectedVoiceButton: {
    backgroundColor: '#4CAF50',
  },
  voiceButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  selectedVoiceButtonText: {
    color: 'white',
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  logsContainer: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 4,
    maxHeight: 200,
  },
  logText: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  sampleSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  sampleSelectorLabel: {
    fontWeight: 'bold',
    marginRight: 8,
  },
  sampleSelectorValue: {
    flex: 1,
    color: '#2196F3',
  },
  sampleSelectorArrow: {
    color: '#757575',
  },
  samplePreview: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  samplePreviewText: {
    fontStyle: 'italic',
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.9,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    borderRadius: 8,
    padding: 15,
    minWidth: 120,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#757575',
    marginRight: 10,
  },
  downloadButton: {
    backgroundColor: '#4CAF50',
    marginLeft: 10,
  },
  buttonTextWhite: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  downloadProgressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  downloadProgressText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#4CAF50',
  },
  progressBarContainer: {
    width: '100%',
    height: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  downloadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#757575',
  },
  metricsContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  metricsTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  quoteList: {
    width: '100%',
    maxHeight: 400,
  },
  quoteItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingVertical: 15,
  },
  selectedQuoteItem: {
    backgroundColor: '#E3F2FD',
  },
  quoteItemLabel: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  quoteItemPreview: {
    color: '#757575',
    fontSize: 12,
  },
  closeQuoteButton: {
    marginTop: 20,
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  warningText: {
    color: '#F57C00',
    fontWeight: 'bold',
    backgroundColor: '#FFF3E0',
    padding: 10,
    borderRadius: 4,
    marginVertical: 10,
    textAlign: 'center',
  },
  actionDisabledText: {
    color: '#F57C00',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 5,
    textAlign: 'center',
  },
  voiceSelectionTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  voiceDropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    borderColor: '#BBDEFB',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  selectedVoiceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  dropdownArrow: {
    fontSize: 16,
    color: '#1976D2',
  },
  voiceDescription: {
    fontStyle: 'italic',
    color: '#616161',
    marginTop: 8,
    lineHeight: 20,
  },
  voiceList: {
    width: '100%',
    maxHeight: 400,
  },
  voiceListItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingVertical: 15,
    paddingHorizontal: 10,
  },
  selectedVoiceListItem: {
    backgroundColor: '#E3F2FD',
  },
  voiceListItemText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  selectedVoiceListItemText: {
    color: '#1976D2',
  },
  voiceDescriptionSmall: {
    fontSize: 12,
    color: '#757575',
    fontStyle: 'italic',
  },
  closeModalButton: {
    marginTop: 20,
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignSelf: 'center',
  },
  modelDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modelName: {
    fontWeight: 'bold',
  },
  modelSize: {
    color: '#616161',
  },
}); 