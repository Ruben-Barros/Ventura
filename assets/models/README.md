# Kokoro TTS Models Directory

This directory is used to store ONNX model files for the Kokoro TTS implementation.

## Required Files

The following files are needed for Kokoro TTS to function:

1. `kokoro-v1.0.ort` - The main ONNX model file
2. `voices-v1.0.bin` - Binary data file containing voice definitions

## Model Sources

The models would typically be downloaded from a server during the app initialization,
or included in the app bundle for offline usage.

Since the actual model files are large (typically 20-50MB) and proprietary, they are
not included in this repository. The implementation will download them from a
configured URL when the app is first run, or use fallback audio methods if the
download fails.

## Model Format

The Kokoro TTS model uses the ONNX (Open Neural Network Exchange) format, which
is an open standard for representing machine learning models. The model is optimized
for mobile devices and can run entirely on-device without requiring an internet
connection after the initial download. 