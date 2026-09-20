(function(){
  var drop = document.getElementById('drop');
  var file = document.getElementById('file');
  var previewArea = document.getElementById('previewArea');
  var prev = document.getElementById('prev');
  var metaStat = document.getElementById('metaStat');
  var latIn = document.getElementById('lat');
  var lonIn = document.getElementById('lon');
  var status = document.getElementById('status');
  var goBtn = document.getElementById('goBtn');

  var currentFile = null;
  var currentBuffer = null;
  var currentBinary = null;
  var currentName = 'photo.jpg';

  window.onerror = function(msg){
    var s = document.getElementById('status');
    if(s){ s.innerHTML = '<b class="no">⚠️ ದೋಷ / Error:</b> ' + msg; }
  };

  function load(f){
    if(!f.type && !/\.(jpe?g|png|webp|heic|heif)$/i.test(f.name)){ status.innerHTML = '<b class="no">⚠️ ದಯವಿಟ್ಟು image file ಆಯ್ಕೆ ಮಾಡಿ</b>'; return; }
    currentFile = f;
    currentBuffer = null;
    currentBinary = null;
    currentName = (f.name || 'photo.jpg').replace(/\.[^.]+$/, '') + '.jpg';

    var frB = new FileReader();
    frB.onload = function(){
      try{
        currentBuffer = frB.result;
        currentBinary = binaryFromBuffer(currentBuffer);
      }catch(e){
        currentBinary = null;
      }
      readExistingGPS();
    };
    frB.onerror = function(){ currentBinary = null; };
    frB.readAsArrayBuffer(f);

    var img = new Image();
    img.onload = function(){
      prev.src = URL.createObjectURL(f);
      previewArea.style.display = 'block';
      status.innerHTML = '✅ ಫೋಟೋ ಸಿದ್ಧ: <b>' + (f.name||'') + '</b> — ಈಗ ಸ್ಥಳ ಹಾಕಿ + ಕೆಳಗೆ Download ಒತ್ತಿ.';
      goBtn.scrollIntoView({behavior:'smooth', block:'nearest'});
    };
    img.onerror = function(){ status.innerHTML = '<b class="no">⚠️ ಈ ಫೋಟೋ ಓದಲು ಆಗುತ್ತಿಲ್ಲ (ಫಾರ್ಮ್ಯಾಟ್ support ಆಗಿಲ್ಲ). JPG ಯಲ್ಲಿ convert ಮಾಡಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.</b>'; };
    img.src = URL.createObjectURL(f);
  }

  function readExistingGPS(){
    if(!currentBinary){ metaStat.innerHTML = 'GPS ಪರಿಶೀಲನೆ ಲಭ್ಯವಿಲ್ಲ — ಮೇಲೆ ಸ್ಥಳ ಹಾಕಿ Download ಮಾಡಿ.'; return; }
    try{
      var exif = piexif.load(currentBinary);
      if(exif.GPS && exif.GPS[piexif.GPSIFD.GPSLatitude]){
        var la = exif.GPS[piexif.GPSIFD.GPSLatitude];
        var lo = exif.GPS[piexif.GPSIFD.GPSLongitude];
        var lr = exif.GPS[piexif.GPSIFD.GPSLatitudeRef];
        var loRef = exif.GPS[piexif.GPSIFD.GPSLongitudeRef];
        if(la && lo){
          var lat = dmsToDec(la, (lr && String(lr).charAt(0) === 'S') ? -1 : 1);
          var lon = dmsToDec(lo, (loRef && String(loRef).charAt(0) === 'W') ? -1 : 1);
          latIn.value = lat.toFixed(6); lonIn.value = lon.toFixed(6);
          metaStat.innerHTML = '<span class="ok">📍 ಫೋಟೋನಲ್ಲಿ ಈಗಾಗಲೇ GPS ಇದೆ:</span> ' + lat.toFixed(6) + ', ' + lon.toFixed(6) + ' — ನೀವು ಬದಲಾಯಿಸಬಹುದು.';
        } else {
          metaStat.innerHTML = '<span class="no">GPS ಇಲ್ಲ</span> — ಮೇಲೆ ಸ್ಥಳ ಹಾಕಿ.';
        }
      } else {
        metaStat.innerHTML = '<span class="no">GPS ಇಲ್ಲ</span> — ಮೇಲೆ ಸ್ಥಳ ಹಾಕಿ.';
      }
    }catch(err){
      metaStat.innerHTML = 'ಫೋಟೋ EXIF ಓದಲಾಗಲಿಲ್ಲ (ಸಾಮಾನ್ಯ). ಮೇಲೆ ಸ್ಥಳ ಹಾಕಿ Download ಮಾಡಿ.';
    }
  }

  function dmsToDec(arr, sign){
    function rat(v){ return v[0] / v[1]; }
    if(!arr || arr.length < 3) return 0;
    return sign * (rat(arr[0]) + rat(arr[1])/60 + rat(arr[2])/3600);
  }

  function toDMS(num){
    num = Math.abs(num);
    var d = Math.floor(num);
    var mf = (num - d) * 60;
    var m = Math.floor(mf);
    var s = Math.round((mf - m) * 60);
    if(s === 60){ s = 0; m += 1; }
    if(m === 60){ m = 0; d += 1; }
    return [[d,1],[m,1],[s,1]];
  }

  function binaryFromBuffer(buf){
    var bytes = new Uint8Array(buf);
    var bins = '';
    var CHUNK = 0x8000;
    for(var i=0;i<bytes.length;i+=CHUNK){
      bins += String.fromCharCode.apply(null, bytes.subarray(i, i+CHUNK));
    }
    return bins;
  }

  function blobFromBinary(bin){
    var u = new Uint8Array(bin.length);
    for(var i=0;i<bin.length;i++){ u[i] = bin.charCodeAt(i) & 0xff; }
    return new Blob([u], {type:'image/jpeg'});
  }

  function jpegBase(a){
    var m = a.match(/^data:([^;]+);base64,(.*)$/);
    return m;
  }

  function insertGpsInto(base64OrBinary, lat, lon){
    var exif = { "0th":{}, "Exif":{} };
    exif["GPS"] = {};
    exif["GPS"][piexif.GPSIFD.GPSVersionID] = [2,3,0,0];
    exif["GPS"][piexif.GPSIFD.GPSLatitudeRef] = (lat >= 0 ? "N" : "S");
    exif["GPS"][piexif.GPSIFD.GPSLatitude] = toDMS(lat);
    exif["GPS"][piexif.GPSIFD.GPSLongitudeRef] = (lon >= 0 ? "E" : "W");
    exif["GPS"][piexif.GPSIFD.GPSLongitude] = toDMS(lon);
    var exifBytes = piexif.dump(exif);
    return piexif.insert(exifBytes, base64OrBinary);
  }

  function downloadBlob(blob, name){
    var objUrl = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = objUrl;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addFallback(objUrl);
  }

  function addFallback(objUrl){
    var old = document.getElementById('fbLink');
    if(old){ old.remove(); }
    var box = document.createElement('div');
    box.id = 'fbLink';
    box.style.marginTop = '12px';
    box.style.padding = '12px 14px';
    box.style.border = '1px solid rgba(80,200,120,.4)';
    box.style.borderRadius = '12px';
    box.style.background = 'rgba(80,200,120,.06)';
    box.innerHTML = '<b style="color:#7BE09A;">Download start ಆಗಲಿಲ್ಲವೇ?</b> ಕೆಳಗಿನ ಲಿಂಕ್ right-click / long-press ಮಾಡಿ "Download / Save link as" ಆರಿಸಿ:<br><a href="' + objUrl + '" download="' + currentName + '" style="display:inline-block;margin-top:8px;padding:10px 16px;border-radius:10px;background:linear-gradient(135deg,#D6A23A,#E8B84D);color:#0A1628;font-weight:700;text-decoration:none;font-size:14px;">📥 ' + currentName + ' Download</a>';
    goBtn.parentNode.appendChild(box);
    box.scrollIntoView({behavior:'smooth', block:'nearest'});
  }

  function isJpeg(f){
    return (f.type && f.type.toLowerCase().indexOf('jpeg') >= 0) || /\.jpe?g$/i.test(f.name);
  }

  function processWithCanvas(lat, lon){
    var img = new Image();
    img.onload = function(){
      try{
        var c = document.createElement('canvas');
        var maxW = 4096;
        var scale = Math.min(1, maxW / img.width);
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        var ctx = c.getContext('2d');
        if(!ctx){ throw new Error('Canvas error'); }
        ctx.drawImage(img, 0, 0, c.width, c.height);
        var m = jpegBase(c.toDataURL('image/jpeg', 0.92));
        var dataUrl = insertGpsInto(m[0], lat, lon);
        var bin = atob(dataUrl.split(',')[1]);
        downloadBlob(blobFromBinary(bin), currentName);
        status.innerHTML = '<span class="ok">✅ Success!</span> GPS ಸೇರಿದ JPG download ಆಗಬೇಕು — ಆಗದಿದ್ದರೆ ಕೆಳಗಿನ ಲಿಂಕ್ ಬಳಸಿ.';
      }catch(err){
        status.innerHTML = '<b class="no">⚠️ convert ಆಗಲಿಲ್ಲ:</b> ' + err.message;
      }
    };
    img.onerror = function(){ status.innerHTML = '<b class="no">ಫೋಟೋ ಓದಲಾಗಲಿಲ್ಲ</b>'; };
    img.src = URL.createObjectURL(currentFile);
  }

  goBtn.addEventListener('click', function(){
    if(!currentFile){ status.innerHTML = '<b class="no">ಫೋಟೋ ಆಯ್ಕೆ ಮಾಡಿ</b>'; return; }
    var lat = parseFloat(latIn.value);
    var lon = parseFloat(lonIn.value);
    if(isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180){
      status.innerHTML = '<b class="no">⚠️ ಸರಿಯಾದ Latitude (-90..90) ಮತ್ತು Longitude (-180..180) ಹಾಕಿ</b>';
      return;
    }
    status.innerHTML = '⚙️ GPS ಸೇರಿಸಲಾಗುತ್ತಿದೆ...';
    try{
      if(isJpeg(currentFile) && currentBinary){
        var outBin = insertGpsInto(currentBinary, lat, lon);
        downloadBlob(blobFromBinary(outBin), currentName);
        status.innerHTML = '<span class="ok">✅ Success!</span> GPS ಸೇರಿದ JPG download ಆಗಬೇಕು — ಆಗದಿದ್ದರೆ ಕೆಳಗಿನ ಹಸಿರು ಲಿಂಕ್ ಬಳಸಿ. (ಫೋಟೋ Properties → Details ನಲ್ಲಿ GPS ನೋಡಿ.)';
      } else {
        metaStat.innerHTML = '<span class="no">PNG/WebP/HEIC — ಸ್ವಯಂ JPG convert ಆಗುತ್ತದೆ</span>';
        processWithCanvas(lat, lon);
      }
    }catch(err){
      status.innerHTML = '<b class="no">⚠️ EXIF write ಆಗಲಿಲ್ಲ:</b> ' + err.message;
    }
  });

  drop.addEventListener('click', function(){ file.click(); });
  document.getElementById('chooseBtn').addEventListener('click', function(e){ e.stopPropagation(); });

  window.addEventListener('dragover', function(e){ e.preventDefault(); e.stopPropagation(); if(e.target === drop || drop.contains(e.target)){ drop.classList.add('drag'); } });
  window.addEventListener('dragenter', function(e){ e.preventDefault(); drop.classList.add('drag'); });
  window.addEventListener('dragleave', function(e){ drop.classList.remove('drag'); });
  window.addEventListener('drop', function(e){ e.preventDefault(); e.stopPropagation(); drop.classList.remove('drag'); if(e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length){ load(e.dataTransfer.files[0]); } });

  file.addEventListener('change', function(){ if(file.files.length) load(file.files[0]); });

  document.getElementById('locBtn').addEventListener('click', function(){
    if(!navigator.geolocation){ status.innerHTML = '<b class="no">⚠️ ಈ browser ನಲ್ಲಿ location support ಇಲ್ಲ</b>'; return; }
    status.innerHTML = '📍 ನಿಮ್ಮ ಸ್ಥಳ ತರಲಾಗುತ್ತಿದೆ...';
    navigator.geolocation.getCurrentPosition(function(pos){
      latIn.value = pos.coords.latitude.toFixed(6);
      lonIn.value = pos.coords.longitude.toFixed(6);
      status.innerHTML = '<span class="ok">📍 ನಿಮ್ಮ ಸ್ಥಳ ಸಿಕ್ಕಿತು</span> — ಈಗ Download ಒತ್ತಿ. (ಖಚಿತಕ್ಕೆ ಸ್ಥಳವನ್ನು verify ಮಾಡಿ.)';
    }, function(err){
      status.innerHTML = '<b class="no">⚠️ ಸ್ಥಳ ಸಿಗಲಿಲ್ಲ.</b> ಕೈಯಿಂದ Lat/Lon ಹಾಕಿ ಅಥವಾ Google Maps ಬಳಸಿ.';
    }, {enableHighAccuracy:true, timeout:15000});
  });
})();