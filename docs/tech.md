# First Contact - Technical File

## Software components

The program is a web application that runs on Chromium on the Raspberry. It does face expression and hand detection from camera input thanks to AI models provided by Google's Tensorflow, then a piece of software, thereafter refered to as The Algorithm, has been written specially for the artwork that generates abstract visuals based on these perceived inputs.

All software components are products that allows the use of them in artistic endeavors, whether commercial or non-commercial.

All software components are free and open source, even The Algorithm. License details and source code links:

- Chromium
  - License: BSD 2.0
  - Source code: [src.chromium.org](https://src.chromium.org/)
- Tensorflow
  - License: Apache 2.0
  - Source code: [github.com/tensorflow/tensorflow](https://github.com/tensorflow/tensorflow)
- Algorithm
  - License: MIT
  - Source code: [github.com/ninofiliu/first-contact](https://github.com/ninofiliu/first-contact)

## Physical components

- 1x Philips UVSH 14HT3152/41
  - Screen type: CRT
  - Weight: 20kg approx
  - Video signal input: SCART
- 1x Raspberry PI 4 model B
  - Video signal output: HDMI
  - Power supply connector: USB-C
  - Power input: 5V DC
- 1x Raspberry PI Camera module
- 1x Raspberry PI power supply module
- 1x HDMI to SCART converter

## Dimensions

55cm x 65cm x 70cm approx

Installation render (the monitor is not the same model, but it basically looks like this)

## Installation

1. Connect the computer and the TV with the HDMI/Peritel converter in between
2. Press down the `power` and `tv` buttons of the URC4504 universal remote control until the red light stays on when pressing up
3. Type 0085 on the remote to select the Philip TV model
4. Type 0 on the remote to fetch the AV input
