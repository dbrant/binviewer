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
var currentOffset = 0;
var scrollbarDragging = false;
var scrollbarDragStartY = 0;
var scrollbarDragStartTop = 0;

document.addEventListener("DOMContentLoaded", function(event) { 
    setupTheme();
    setup();
});

function setupTheme() {
    var saved = localStorage.getItem("theme") || "auto";
    applyTheme(saved);
    updateThemeButtons(saved);

    var buttons = document.querySelectorAll("#themeToggle button");
    for (var i = 0; i < buttons.length; i++) {
        buttons[i].addEventListener("click", function() {
            var theme = this.getAttribute("data-theme");
            localStorage.setItem("theme", theme);
            applyTheme(theme);
            updateThemeButtons(theme);
        });
    }
}

function updateThemeButtons(theme) {
    var buttons = document.querySelectorAll("#themeToggle button");
    for (var i = 0; i < buttons.length; i++) {
        if (buttons[i].getAttribute("data-theme") === theme) {
            buttons[i].classList.add("active");
        } else {
            buttons[i].classList.remove("active");
        }
    }
}

function applyTheme(theme) {
    if (theme === "auto") {
        document.documentElement.removeAttribute("data-theme");
    } else {
        document.documentElement.setAttribute("data-theme", theme);
    }
}

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
        currentOffset = parseInt(document.getElementById("udFileOffset").value) || 0;
        renderCurrentBitmap();
        updateScrollbar();
    });
    document.getElementById("selectBmpType").addEventListener("change", function(ev) {
        renderCurrentBitmap();
        updateScrollbar();
    });

    var holder = document.getElementById("holder");

    // Mouse wheel scrolling on the holder area
    holder.addEventListener("wheel", function(ev) {
        if (!curRenderer) return;
        ev.preventDefault();
        var bytesPerRow = getBytesPerRow();
        var rowsToScroll = 3;
        var delta = Math.sign(ev.deltaY) * bytesPerRow * rowsToScroll;

        setOffset(currentOffset + delta);
    }, { passive: false });

    // Custom scrollbar drag handling
    var scrollbarThumb = document.getElementById("scrollbarThumb");
    var scrollbar = document.getElementById("scrollbar");

    scrollbarThumb.addEventListener("mousedown", function(ev) {
        ev.preventDefault();
        scrollbarDragging = true;
        scrollbarDragStartY = ev.clientY;
        scrollbarDragStartTop = scrollbarThumb.offsetTop;
        scrollbarThumb.classList.add("dragging");
    });

    document.addEventListener("mousemove", function(ev) {
        if (!scrollbarDragging || !curRenderer) return;
        ev.preventDefault();
        var scrollbar = document.getElementById("scrollbar");
        var thumb = document.getElementById("scrollbarThumb");
        var trackHeight = scrollbar.clientHeight;
        var thumbHeight = thumb.clientHeight;
        var maxTop = trackHeight - thumbHeight;

        var deltaY = ev.clientY - scrollbarDragStartY;
        var newTop = Math.max(0, Math.min(maxTop, scrollbarDragStartTop + deltaY));

        var maxOffset = getMaxOffset();
        var newOffset = maxTop > 0 ? Math.round((newTop / maxTop) * maxOffset) : 0;

        setOffset(newOffset);
    });

    document.addEventListener("mouseup", function(ev) {
        if (scrollbarDragging) {
            scrollbarDragging = false;
            document.getElementById("scrollbarThumb").classList.remove("dragging");
        }
    });

    // Click on track (outside thumb) to jump
    scrollbar.addEventListener("mousedown", function(ev) {
        if (ev.target !== scrollbar || !curRenderer) return;
        var thumb = document.getElementById("scrollbarThumb");
        var trackHeight = scrollbar.clientHeight;
        var thumbHeight = thumb.clientHeight;
        var maxTop = trackHeight - thumbHeight;

        var clickY = ev.clientY - scrollbar.getBoundingClientRect().top - thumbHeight / 2;
        var newTop = Math.max(0, Math.min(maxTop, clickY));

        var maxOffset = getMaxOffset();
        var newOffset = maxTop > 0 ? Math.round((newTop / maxTop) * maxOffset) : 0;

        setOffset(newOffset);
    });

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
        document.getElementById("scrollbar").style.display = "block";
        clearCanvas();

        currentOffset = 0;
        document.getElementById("udFileOffset").value = 0;
        renderCurrentBitmap();
        updateScrollbar();
    };
    reader.readAsArrayBuffer(file);
}

function getBytesPerPixel() {
    var bmpType = document.getElementById("selectBmpType").value;
    if (bmpType === "rgb24" || bmpType === "bgr24") return 3;
    if (bmpType === "rgb_32" || bmpType === "_rgb32" || bmpType === "rgba32" || bmpType === "argb32") return 4;
    if (bmpType === "565" || bmpType === "555") return 2;
    if (bmpType === "grey8") return 1;
    if (bmpType === "ega4") return 0.5;
    if (bmpType === "mono1" || bmpType === "mono1inv") return 0.125;
    return 1;
}

function getBytesPerRow() {
    var width = parseInt(document.getElementById("udBmpWidth").value) || 320;
    return Math.max(1, Math.ceil(width * getBytesPerPixel()));
}

function getVisibleBytes() {
    var holder = document.getElementById("holder");
    var height = holder.clientHeight;
    return getBytesPerRow() * height;
}

function getMaxOffset() {
    if (!curRenderer) return 0;
    var total = curRenderer.length();
    var visible = getVisibleBytes();
    return Math.max(0, total - visible);
}

function setOffset(newOffset) {
    var maxOffset = getMaxOffset();
    newOffset = Math.max(0, Math.min(maxOffset, newOffset));
    currentOffset = newOffset;
    document.getElementById("udFileOffset").value = newOffset;
    renderCurrentBitmap();
    updateScrollbar();
}

function updateScrollbar() {
    if (!curRenderer) return;
    var scrollbar = document.getElementById("scrollbar");
    var thumb = document.getElementById("scrollbarThumb");
    var trackHeight = scrollbar.clientHeight;

    var totalBytes = curRenderer.length();
    var visibleBytes = getVisibleBytes();

    // Thumb height proportional to visible / total
    var thumbRatio = Math.min(1, visibleBytes / totalBytes);
    var thumbHeight = Math.max(20, Math.round(trackHeight * thumbRatio));
    thumb.style.height = thumbHeight + "px";

    // Thumb position
    var maxOffset = getMaxOffset();
    var maxTop = trackHeight - thumbHeight;
    var thumbTop = maxOffset > 0 ? Math.round((currentOffset / maxOffset) * maxTop) : 0;
    thumb.style.top = thumbTop + "px";
}

function renderCurrentBitmap() {
    if (!curRenderer) {
        return;
    }
    var holder = document.getElementById("holder");

    var bmpType = document.getElementById("selectBmpType").value;
    var offset = currentOffset;
    var context = document.getElementById("previewCanvas").getContext('2d');
    var width = document.getElementById("udBmpWidth").value;
    var height = holder.clientHeight;

    resizeCanvas(width, height);

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
