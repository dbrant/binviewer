/*
 Copyright (c) 2022 Dmitry Brant.
 https://dmitrybrant.com

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

var DataReader = function(dView) {
    this.dataView = dView;

    this.getCanvasContext = function() {
        // override me
    };

    this.createImageData = function(bmpWidth, bmpHeight) {
        return this.getCanvasContext().createImageData(bmpWidth, bmpHeight);
    };

    this.onGetPreviewImage = function(imageSrc) {
        // override me
    };

    this.onGetPreviewBitmap = function(imageData) {
        // override me
    };

    this.length = function() {
        return this.dataView.byteLength;
    };

    this.byteAt = function(offset) {
        return this.dataView.getUint8(offset);
    };

    this.ushortLeAt = function(offset) {
        return this.dataView.getUint16(offset, true);
    };

    this.ushortBeAt = function(offset) {
        return this.dataView.getUint16(offset, false);
    };

    this.shortLeAt = function(offset) {
        return this.dataView.getInt16(offset, true);
    };

    this.shortBeAt = function(offset) {
        return this.dataView.getInt16(offset, false);
    };

    this.uintLeAt = function(offset) {
        return this.dataView.getUint32(offset, true);
    };

    this.uintBeAt = function(offset) {
        return this.dataView.getUint32(offset, false);
    };

    this.intLeAt = function(offset) {
        return this.dataView.getInt32(offset, true);
    };

    this.intBeAt = function(offset) {
        return this.dataView.getInt32(offset, false);
    };

    this.floatLeAt = function(offset) {
        return this.dataView.getFloat32(offset, true);
    };

    this.floatBeAt = function(offset) {
        return this.dataView.getFloat32(offset, false);
    };

    this.doubleLeAt = function(offset) {
        return this.dataView.getFloat64(offset, true);
    };

    this.doubleBeAt = function(offset) {
        return this.dataView.getFloat64(offset, false);
    };

    this.getAsciiStringAt = function(offset, length) {
        var result = "";
        for (var i = 0; i < length; i++) {
            result += String.fromCharCode(this.byteAt(offset + i));
        }
        return result;
    }

};

var FileBmpRenderer = function(dReader) {
    this.reader = dReader;

    this.length = function() {
        return this.reader.length();
    }

    this.render = function(imageData, imgWidth, imgHeight, offset, bmpType) {
        var bmpData = imageData.data;

        var bmpPtr = 0;
        var maxBmpPtr = imgWidth * imgHeight * 4;

        var dataPtr = offset;
        var maxDataPtr = this.reader.length();

        if (bmpType === "rgb24") {
            while (bmpPtr < maxBmpPtr && dataPtr < maxDataPtr - 3) {
                bmpData[bmpPtr] = this.reader.byteAt(dataPtr++);
                bmpData[bmpPtr + 1] = this.reader.byteAt(dataPtr++);
                bmpData[bmpPtr + 2] = this.reader.byteAt(dataPtr++);
                bmpData[bmpPtr + 3] = 0xFF;
                bmpPtr += 4;
            }
        } else if (bmpType === "rgb32") {
            while (bmpPtr < maxBmpPtr && dataPtr < maxDataPtr - 4) {
                bmpData[bmpPtr] = this.reader.byteAt(dataPtr++);
                bmpData[bmpPtr + 1] = this.reader.byteAt(dataPtr++);
                bmpData[bmpPtr + 2] = this.reader.byteAt(dataPtr++);
                bmpData[bmpPtr + 3] = 0xFF; dataPtr++;
                bmpPtr += 4;
            }
        } else if (bmpType === "rgba32") {
            while (bmpPtr < maxBmpPtr && dataPtr < maxDataPtr - 4) {
                bmpData[bmpPtr] = this.reader.byteAt(dataPtr++);
                bmpData[bmpPtr + 1] = this.reader.byteAt(dataPtr++);
                bmpData[bmpPtr + 2] = this.reader.byteAt(dataPtr++);
                bmpData[bmpPtr + 3] = this.reader.byteAt(dataPtr++);
                bmpPtr += 4;
            }
        } else if (bmpType === "grey8") {
            while (bmpPtr < maxBmpPtr && dataPtr < maxDataPtr) {
                var b = this.reader.byteAt(dataPtr++);
                bmpData[bmpPtr] = b;
                bmpData[bmpPtr + 1] = b;
                bmpData[bmpPtr + 2] = b;
                bmpData[bmpPtr + 3] = 0xFF; 
                bmpPtr += 4;
            }
        }

    };

}
