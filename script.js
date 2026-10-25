 (() => {
      // Tanggal acara dipertahankan sesuai kode asli.
      const targetDate = new Date("2026-12-18T18:30:00+07:00").getTime();

      function updateTimer() {
        const diff = targetDate - Date.now();
        const ids = ["cd-days", "cd-hours", "cd-mins", "cd-secs"];
        if (diff <= 0) {
          ids.forEach(id => { const el = document.getElementById(id); if (el) el.textContent = "00"; });
          document.getElementById("countdown-ended")?.classList.remove("d-none");
          return;
        }
        const values = [
          Math.floor(diff / 86400000),
          Math.floor((diff % 86400000) / 3600000),
          Math.floor((diff % 3600000) / 60000),
          Math.floor((diff % 60000) / 1000)
        ];
        ids.forEach((id, i) => {
          const el = document.getElementById(id);
          if (el) el.textContent = String(values[i]).padStart(2, "0");
        });
      }
      updateTimer();
      setInterval(updateTimer, 1000);

      // ===== Pemutar musik =====
      // Dua tombol, dua lagu: pill di navbar memutar Akad, panel "Preview Track 01" memutar Menuju Senja.
      // Hanya satu lagu yang boleh berbunyi pada satu waktu.
      const vinyl = document.getElementById("vinyl-disc");
      const progressBar = document.getElementById("progress-bar");
      const timeLabel = document.getElementById("track-time");

      const players = [
        { key: "nav",     src: "Akad.mp3",        btn: "nav-play-toggle",   icon: "nav-play-icon" },
        { key: "preview", src: "MenujuSenja.mp3", btn: "btn-play-preview",  icon: "play-icon" }
      ].map(cfg => {
        const audio = new Audio();
        audio.preload = "metadata";
        audio.src = encodeURI(cfg.src);
        return { ...cfg, audio };
      });

      const fmt = sec => {
        if (!isFinite(sec)) return "00:00";
        const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
        return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
      };

      function refreshUI() {
        let anyPlaying = false;
        players.forEach(p => {
          const playing = !p.audio.paused;
          anyPlaying = anyPlaying || playing;
          const icon = document.getElementById(p.icon);
          if (icon) icon.textContent = playing ? "pause" : "play_arrow";
        });
        vinyl?.classList.toggle("animate-spin-slow", anyPlaying);
        // Putaran piringan berhenti (bukan reset) saat jeda.
        if (vinyl) vinyl.style.animationPlayState = anyPlaying ? "running" : "paused";
      }

      function refreshProgress() {
        const a = players[1].audio;
        const pct = a.duration ? (a.currentTime / a.duration) * 100 : 0;
        if (progressBar) progressBar.style.width = pct + "%";
        if (timeLabel) timeLabel.textContent = a.currentTime > 0 && !a.paused
          ? fmt(a.currentTime) + " / " + fmt(a.duration)
          : fmt(a.duration);
      }

      async function toggle(p) {
        if (p.audio.paused) {
          // Hentikan lagu lain agar tidak bertumpuk.
          players.forEach(o => { if (o !== p && !o.audio.paused) o.audio.pause(); });
          try {
            await p.audio.play();
          } catch (err) {
            console.error("Gagal memutar audio:", p.src, err);
          }
        } else {
          p.audio.pause();
        }
        refreshUI();
      }

      players.forEach(p => {
        document.getElementById(p.btn)?.addEventListener("click", () => toggle(p));
        ["play", "pause", "ended"].forEach(ev => p.audio.addEventListener(ev, refreshUI));
        p.audio.addEventListener("error", () => console.error("File audio tidak ditemukan / tidak bisa dimuat:", p.src));
      });
      players[1].audio.addEventListener("timeupdate", refreshProgress);
      players[1].audio.addEventListener("loadedmetadata", refreshProgress);
      players[1].audio.addEventListener("ended", () => { players[1].audio.currentTime = 0; refreshProgress(); });

      // Klik pada progress bar untuk memajukan / memundurkan lagu preview.
      document.getElementById("progress-track")?.addEventListener("click", e => {
        const a = players[1].audio;
        if (!a.duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        a.currentTime = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)) * a.duration;
        refreshProgress();
      });
      refreshProgress();

      // Unduh file kalender .ics untuk menyimpan tanggal acara.
      document.getElementById("save-date")?.addEventListener("click", () => {
        const calendar = [
          "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//AR Wedding//Invitation//ID",
          "BEGIN:VEVENT", "UID:ar-wedding-20251018@example.com",
          "DTSTAMP:20261023T000000Z", "DTSTART:20251018T113000Z", "DTEND:20251018T130000Z",
          "SUMMARY:Adrian & Rosalind — Wedding Celebration",
          "LOCATION:The Glass House, Jakarta Selatan", "END:VEVENT", "END:VCALENDAR"
        ].join("\r\n");
        const blob = new Blob([calendar], { type: "text/calendar;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = "adrian-rosalind-wedding.ics"; a.click();
        URL.revokeObjectURL(url);
      });

      document.getElementById("message-form")?.addEventListener("submit", event => {
        event.preventDefault();
        const input = document.getElementById("message-text");
        const feedback = document.getElementById("message-feedback");
        feedback.textContent = "Ucapan siap dikirim, tetapi form ini belum terhubung ke server.";
        feedback.classList.remove("d-none");
        input.value = "";
      });
    })();