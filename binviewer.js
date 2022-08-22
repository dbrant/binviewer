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

 var curRenderer;

 document.addEventListener("DOMContentLoaded", function(event) { 
     setup();
 });

 function setup() {
     if (typeof window.FileReader === 'undefined') {
         setStatus('Error: File API and/or FileReader API not supported.');
         document.getElementById("topContainer").style.display = "none";
         return;
     } else {
         setStatus("");
     }

     document.getElementById("fileBrowseInput").addEventListener("change", function(event) {
         processFile(event.target.files[0]);
     });
     document.getElementById("fileBrowseButton").addEventListener("click", function(event) {
         document.getElementById("fileBrowseInput").click();
     });

     document.getElementById("savePngLink").addEventListener("click", function(event) {
         openBase64UrlInNewWindow(document.getElementById("previewCanvas").toDataURL("image/png"));
     });
     document.getElementById("saveJpgLink").addEventListener("click", function(event) {
         openBase64UrlInNewWindow(document.getElementById("previewCanvas").toDataURL("image/jpeg"));
     });

     document.getElementById("udBmpScale").addEventListener("change", function(ev) {
         var canvas = document.getElementById("previewCanvas");
         var scaleVal = document.getElementById("udBmpScale").value;
         canvas.style.transform = "scale(" + scaleVal + ")";
     });
     document.getElementById("udBmpWidth").addEventListener("change", function(ev) {
         renderCurrentBitmap();
     });
     document.getElementById("udFileOffset").addEventListener("change", function(ev) {
         renderCurrentBitmap();
     });
     document.getElementById("selectBmpType").addEventListener("change", function(ev) {
         renderCurrentBitmap();
     });
     document.getElementById("rangeFileOffset").addEventListener("input", function(ev) {
         onScrollBarChanged();
     });
     document.getElementById("rangeFileOffset").addEventListener("change", function(ev) {
         onScrollBarChanged();
     });

     var holder = document.getElementById("holder");

     holder.addEventListener("dragover", function(ev) {
         ev.preventDefault();
         if(!holder.classList.contains("dragover")) {
             holder.classList.add("hover");
         }
     });
 
     holder.addEventListener("dragend", function(ev) {
         ev.preventDefault();
         holder.classList.remove("hover");
     });

     holder.addEventListener("dragleave", function(ev) {
         ev.preventDefault();
         holder.classList.remove("hover");
     });

     holder.addEventListener("drop", function(ev) {
         ev.preventDefault();
         holder.classList.remove("hover");
         if (!ev.dataTransfer) {
             console.log("No data found in dropped object.");
             return;
         }
         processFile(ev.dataTransfer.files[0]);
     });
 }

 function processFile(file) {
     setStatus("");
     if(file == null){
         setStatus("Whatever was dropped is not a file.");
         return;
     }
     var reader = new FileReader();
     reader.onload = function (event) {
         var buf = event.target.result;
         var dataView = new DataView(buf);
         var reader = new DataReader(dataView);
         curRenderer = new FileBmpRenderer(reader)

         document.getElementById("drophint").style.display = "none";
         document.getElementById("previewCanvas").style.display = "inline";
         clearCanvas();

         renderCurrentBitmap();
     };
     reader.readAsArrayBuffer(file);
 }

 function onScrollBarChanged() {
     if (curRenderer) {
         var totalLength = curRenderer.length();
         var rangeVal = document.getElementById("rangeFileOffset").value;
         var rangeMax = document.getElementById("rangeFileOffset").max;

         document.getElementById("udFileOffset").value = parseInt((totalLength * rangeVal / rangeMax));
         renderCurrentBitmap();
     }
 }

 function renderCurrentBitmap() {
     if (!curRenderer) {
         return;
     }
     var holder = document.getElementById("holder");

     var bmpType = document.getElementById("selectBmpType").value;
     var offset = document.getElementById("udFileOffset").value;
     var context = document.getElementById("previewCanvas").getContext('2d');
     var width = document.getElementById("udBmpWidth").value;
     var height = holder.clientHeight;

     resizeCanvas(width, height);

     //this.reader.createImageData(imgWidth, imgHeight);
     var imageData = context.getImageData(0, 0, width, height);
     curRenderer.render(imageData, width, height, offset, bmpType);
     context.putImageData(imageData, 0, 0);
 }

 function setStatus(status) {
     var fileReaderStatus = document.getElementById("fileReaderStatus");
     if (status.length > 0) {
         fileReaderStatus.style.display = "block";
         fileReaderStatus.innerHTML = status;
     } else {
         fileReaderStatus.style.display = "none";
     }
 }

 function resizeCanvas(width, height) {
     var canvas = document.getElementById("previewCanvas");
     canvas.width = width;
     canvas.height = height;
     //var scaledHeight = height > 320 ? 320 : height;
     //var scaledWidth = width * (scaledHeight / height);
     canvas.style.width = width.toString() + "px";
     canvas.style.height = height.toString() + "px";
 }

 function clearCanvas() {
     var canvas = document.getElementById("previewCanvas");
     canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
 }

 function openBase64UrlInNewWindow(base64URL){
     window.open().document.write('<iframe src="' + base64URL + '" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>');
 }
