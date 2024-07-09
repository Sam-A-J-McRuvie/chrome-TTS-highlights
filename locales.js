// config for the text-to-speech module
const ttsConfig = {
    default_voice: "Microsoft George - English (United Kingdom)",
    default_rate: 0.8,
    default_lang: "en-GB",
    tts_events: [
        "start",
        "end",
        "word",
        "error",
        "interrupted",
        "cancelled",
    ],
};

export { ttsConfig };
