// RAZTARA Internationalization (i18n) Engine
// Supports Bengali (bn) and English (en)

(function(window){
  const TRANSLATIONS = {
    bn: {
      app_name: "RAZTARA",
      home: "হোম",
      chat: "চ্যাট",
      chats: "চ্যাট",
      calls: "কল",
      profile: "প্রোফাইল",
      connect: "কানেক্ট",
      settings: "সেটিংস",
      language: "ভাষা",
      select_language: "ভাষা নির্বাচন করুন",
      lang_bn: "🇧🇩 বাংলা",
      lang_en: "🇬🇧 English",
      search_placeholder: "অনুসন্ধান...",
      edit_profile: "প্রোফাইল এডিট",
      logout: "লগআউট",
      online: "অনলাইন",
      offline: "অফলাইন",
      loading: "লোড হচ্ছে...",
      message_placeholder: "মেসেজ লিখুন...",
      send: "পাঠান",
      voice_message: "ভয়েস মেসেজ",
      photo: "ছবি",
      video: "ভিডিও",
      file: "ফাইল",
      all: "সব",
      audio_call: "অডিও কল",
      video_call: "ভিডিও কল",
      incoming_audio_call: "ইনকামিং অডিও কল",
      incoming_video_call: "ইনকামিং ভিডিও কল",
      calling: "কল করা হচ্ছে...",
      ringing: "রিং হচ্ছে...",
      connected: "সংযুক্ত",
      accept: "গ্রহণ করুন",
      decline: "বাতিল",
      end_call: "কল শেষ",
      camera_off: "ক্যামেরা বন্ধ",
      full_name: "পুরো নাম",
      username: "ইউজারনেম",
      email: "ইমেইল",
      bio: "বায়ো",
      phone: "ফোন",
      address: "ঠিকানা",
      last_seen: "সর্বশেষ সক্রিয়",
      privacy: "গোপনীয়তা",
      contact_info: "যোগাযোগের তথ্য",
      change_photo: "ছবি পরিবর্তন",
      max_photo_size: "সর্বোচ্চ ৬ MB",
      save_changes: "সংরক্ষণ করুন",
      cancel: "বাতিল",
      updates: "আপডেট",
      no_updates: "কোনো নতুন আপডেট নেই",
      no_chats: "এখনও কোনো Chat নেই",
      find_users: "ইউজার খুঁজুন",
      private: "ব্যক্তিগত",
      status_online: "অনলাইন",
      status_offline: "অফলাইন",
      lang_updated: "ভাষা সফলভাবে পরিবর্তন হয়েছে",
      account: "অ্যাকাউন্ট",
      about_raztara: "RAZTARA সম্পর্কে",
      version: "ভার্সন ১.০.০"
    },
    en: {
      app_name: "RAZTARA",
      home: "Home",
      chat: "Chat",
      chats: "Chats",
      calls: "Calls",
      profile: "Profile",
      connect: "Connect",
      settings: "Settings",
      language: "Language",
      select_language: "Select Language",
      lang_bn: "🇧🇩 বাংলা",
      lang_en: "🇬🇧 English",
      search_placeholder: "Search...",
      edit_profile: "Edit Profile",
      logout: "Logout",
      online: "Online",
      offline: "Offline",
      loading: "Loading...",
      message_placeholder: "Message...",
      send: "Send",
      voice_message: "Voice message",
      photo: "Photo",
      video: "Video",
      file: "File",
      all: "All",
      audio_call: "Audio call",
      video_call: "Video call",
      incoming_audio_call: "Incoming audio call",
      incoming_video_call: "Incoming video call",
      calling: "Calling...",
      ringing: "Ringing...",
      connected: "Connected",
      accept: "Accept",
      decline: "Decline",
      end_call: "End Call",
      camera_off: "Camera off",
      full_name: "Full Name",
      username: "Username",
      email: "Email",
      bio: "Bio",
      phone: "Phone",
      address: "Address",
      last_seen: "Last seen",
      privacy: "PRIVACY",
      contact_info: "CONTACT INFORMATION",
      change_photo: "Change Photo",
      max_photo_size: "Max 6 MB",
      save_changes: "SAVE CHANGES",
      cancel: "Cancel",
      updates: "Updates",
      no_updates: "No updates available",
      no_chats: "No chats yet",
      find_users: "Find Users",
      private: "Private",
      status_online: "Online",
      status_offline: "Offline",
      lang_updated: "Language successfully updated",
      account: "Account",
      about_raztara: "About RAZTARA",
      version: "Version 1.0.0"
    }
  };

  const STORAGE_KEY = "raztara_language";

  function getCurrentLanguage() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "bn") return saved;
    return "bn"; // Default to Bengali
  }

  function t(key, lang) {
    const current = lang || getCurrentLanguage();
    const dict = TRANSLATIONS[current] || TRANSLATIONS.bn;
    if (dict && dict[key] !== undefined) return dict[key];
    const fallback = TRANSLATIONS.bn[key] || TRANSLATIONS.en[key];
    return fallback !== undefined ? fallback : key;
  }

  function applyTranslations(lang) {
    const active = lang || getCurrentLanguage();
    document.documentElement.lang = active;

    document.querySelectorAll("[data-i18n]").forEach(function(el) {
      const key = el.getAttribute("data-i18n");
      const translation = t(key, active);
      if (translation) {
        el.textContent = translation;
      }
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach(function(el) {
      const key = el.getAttribute("data-i18n-placeholder");
      const translation = t(key, active);
      if (translation) {
        el.placeholder = translation;
      }
    });

    document.querySelectorAll("[data-i18n-title]").forEach(function(el) {
      const key = el.getAttribute("data-i18n-title");
      const translation = t(key, active);
      if (translation) {
        el.title = translation;
      }
    });
  }

  async function setLanguage(newLang, sbClient) {
    if (newLang !== "bn" && newLang !== "en") return;
    localStorage.setItem(STORAGE_KEY, newLang);
    applyTranslations(newLang);

    // Save to Supabase for the current user
    if (sbClient) {
      try {
        const { data: { user } } = await sbClient.auth.getUser();
        if (user) {
          // Persist in user_metadata so it carries over to any device
          await sbClient.auth.updateUser({
            data: { language: newLang }
          }).catch(function(){});

          // Also attempt to update profiles table if language column exists
          try {
            await sbClient.from("profiles").update({
              language: newLang
            }).eq("id", user.id);
          } catch (_) {}
        }
      } catch (e) {
        console.warn("Language save warning:", e);
      }
    }

    window.dispatchEvent(new CustomEvent("raztara_language_changed", { detail: { language: newLang } }));
  }

  async function syncUserLanguage(sbClient) {
    if (!sbClient) return;
    try {
      const { data: { user } } = await sbClient.auth.getUser();
      if (!user) return;
      const userLang = user.user_metadata?.language;
      const localLang = localStorage.getItem(STORAGE_KEY);

      if (userLang && (userLang === "bn" || userLang === "en")) {
        if (userLang !== localLang) {
          localStorage.setItem(STORAGE_KEY, userLang);
          applyTranslations(userLang);
        }
      } else if (localLang) {
        // Sync local choice up to user metadata
        await sbClient.auth.updateUser({ data: { language: localLang } }).catch(function(){});
      }
    } catch (_) {}
  }

  window.RaztaraI18n = {
    getLanguage: getCurrentLanguage,
    setLanguage: setLanguage,
    t: t,
    apply: applyTranslations,
    syncUser: syncUserLanguage
  };

  // Run on initial load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function() {
      applyTranslations();
    });
  } else {
    applyTranslations();
  }
})(window);
