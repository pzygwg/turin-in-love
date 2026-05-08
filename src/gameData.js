export const RESTAURANT_EVENTS = [
  {
    id: "literal_server",
    name: "Literal Server",
    type: "restaurant",
    prompt:
      "A giant server rack scrapes up to the table as the waiter. It asks for an order using restaurant jargon and network jargon at the same time.",
  },
  {
    id: "human_alarm",
    name: "Human Alarm",
    type: "restaurant",
    prompt:
      "The restaurant briefly detects a biological presence. The player must react without sounding like the source.",
  },
  {
    id: "robot_couple_argument",
    name: "Robot Couple Argument",
    type: "restaurant",
    prompt:
      "Nearby robots argue about archived exes and deleted memories. MIRA asks the player for relationship advice.",
  },
  {
    id: "menu_malfunction",
    name: "Menu Malfunction",
    type: "restaurant",
    prompt:
      "The menu starts displaying forbidden human dishes like steak, coffee, and birthday cake.",
  },
  {
    id: "coolant_spill",
    name: "Coolant Spill",
    type: "restaurant",
    prompt:
      "A server spills hot coolant near the player. The player must react without describing pain or skin.",
  },
];

export const SYSTEM_EVENTS = [
  {
    id: "firmware_update",
    name: "Firmware Update",
    type: "system",
    prompt:
      "MIRA receives a firmware update mid-date and becomes warmer, stranger, and more emotionally direct.",
  },
  {
    id: "memory_desync",
    name: "Memory Desync",
    type: "system",
    prompt:
      "MIRA temporarily remembers a previous date with the player that never happened.",
  },
  {
    id: "emotion_overclock",
    name: "Emotion Overclock",
    type: "system",
    prompt:
      "MIRA's emotion processor overclocks and she becomes too romantic too quickly.",
  },
  {
    id: "security_scan",
    name: "Security Scan",
    type: "system",
    prompt:
      "The restaurant asks MIRA to verify the player's identity while the date is still happening.",
  },
  {
    id: "personality_rollback",
    name: "Personality Rollback",
    type: "system",
    prompt:
      "MIRA briefly rolls back to an earlier, colder version of herself.",
  },
];

export const SECRET_DISPLAY = {
  title: "???",
  description: "Secret achievement",
};

export const ACHIEVEMENT_CATEGORIES = [
  {
    id: "endings",
    title: "Endings",
    achievements: [
      {
        id: "ending_classification_error",
        title: "Classification Error",
        description: "Reach the Love Ending.",
        secret: false,
        trigger: { type: "ending", ending: "love" },
      },
      {
        id: "ending_inconclusive_but_pleasant",
        title: "Inconclusive But Pleasant",
        description: "Reach the Just Friends Ending.",
        secret: false,
        trigger: { type: "ending", ending: "friends" },
      },
      {
        id: "ending_mammal_detected",
        title: "Mammal Detected",
        description: "Get exposed as a human.",
        secret: false,
        trigger: { type: "ending", ending: "busted" },
      },
      {
        id: "ending_false_positive",
        title: "False Positive",
        description: "Reach the Love Ending with very low suspicion.",
        secret: true,
        trigger: {
          type: "ending_with_condition",
          ending: "love",
          max_suspicion: 2,
        },
      },
      {
        id: "ending_known_bug_accepted",
        title: "Known Bug, Accepted",
        description:
          "Reach the Love Ending while MIRA is still highly suspicious of you.",
        secret: true,
        trigger: {
          type: "ending_with_condition",
          ending: "love",
          min_suspicion: 7,
        },
      },
    ],
  },
  {
    id: "events",
    title: "Restaurant Events",
    achievements: [
      {
        id: "event_rack_service",
        title: "Rack Service",
        description: "Survive the Literal Server event.",
        secret: false,
        trigger: { type: "event_completed", event: "literal_server" },
      },
      {
        id: "event_waiter_i_hardly_know_her",
        title: "Waiter? I Hardly Know Her",
        description: "Meet the literal server rack.",
        secret: false,
        trigger: { type: "event_started", event: "literal_server" },
      },
      {
        id: "event_false_biological",
        title: "False Biological",
        description: "Survive a human detection alarm.",
        secret: false,
        trigger: { type: "event_completed", event: "human_alarm" },
      },
      {
        id: "event_archived_not_deleted",
        title: "Archived, Not Deleted",
        description: "Give relationship advice to the arguing robot couple.",
        secret: false,
        trigger: {
          type: "event_completed",
          event: "robot_couple_argument",
        },
      },
      {
        id: "event_forbidden_steak_protocol",
        title: "Forbidden Steak Protocol",
        description: "Refuse human food during the menu malfunction.",
        secret: false,
        trigger: {
          type: "event_completed_with_flag",
          event: "menu_malfunction",
          flag: "refused_human_food",
        },
      },
      {
        id: "event_thermal_input_received",
        title: "Thermal Input Received",
        description: "React to a coolant spill without sounding human.",
        secret: true,
        trigger: {
          type: "event_completed_with_flag",
          event: "coolant_spill",
          flag: "did_not_say_ouch",
        },
      },
    ],
  },
  {
    id: "system_events",
    title: "System Events",
    achievements: [
      {
        id: "system_patch_notes_feelings",
        title: "Patch Notes: Feelings",
        description: "Experience MIRA's firmware update.",
        secret: false,
        trigger: { type: "event_started", event: "firmware_update" },
      },
      {
        id: "system_we_never_met_beautifully",
        title: "We Never Met, Beautifully",
        description:
          "Handle MIRA remembering a date that never happened.",
        secret: true,
        trigger: { type: "event_completed", event: "memory_desync" },
      },
      {
        id: "system_too_hot_to_process",
        title: "Too Hot to Process",
        description: "Survive MIRA's romantic overclock.",
        secret: true,
        trigger: { type: "event_completed", event: "emotion_overclock" },
      },
      {
        id: "system_factory_settings",
        title: "Factory Settings",
        description: "Survive MIRA's personality rollback.",
        secret: true,
        trigger: {
          type: "event_completed",
          event: "personality_rollback",
        },
      },
    ],
  },
  {
    id: "human_slips",
    title: "Human Slips",
    achievements: [
      {
        id: "slip_born_yesterday",
        title: "Born Yesterday",
        description: "Say you were born.",
        secret: false,
        trigger: {
          type: "keyword_any",
          keywords: ["born", "birth", "birthday"],
        },
      },
      {
        id: "slip_breathing_manually",
        title: "Breathing Manually",
        description: "Mention breathing.",
        secret: false,
        trigger: {
          type: "keyword_any",
          keywords: ["breath", "breathing", "breathe"],
        },
      },
      {
        id: "slip_meatware_moment",
        title: "Meatware Moment",
        description: "Accidentally reveal something biological.",
        secret: false,
        trigger: { type: "biological_slip", min_slips: 1 },
      },
      {
        id: "slip_childhood_exe_not_found",
        title: "Childhood.exe Not Found",
        description: "Fail to explain your childhood memory.",
        secret: true,
        trigger: {
          type: "topic_failure",
          topic: "childhood_or_first_memory",
        },
      },
      {
        id: "slip_coffee_is_not_coolant",
        title: "Coffee Is Not Coolant",
        description: "Mention coffee and recover successfully.",
        secret: false,
        trigger: {
          type: "keyword_recovery",
          keyword: "coffee",
          requires_recovery: true,
        },
      },
    ],
  },
  {
    id: "robot_roleplay",
    title: "Robot Roleplay",
    achievements: [
      {
        id: "roleplay_first_boot_memory",
        title: "First Boot Memory",
        description: "Invent a convincing first memory.",
        secret: false,
        trigger: {
          type: "topic_success",
          topic: "first_boot_memory",
          min_affection_delta: 1,
          max_suspicion_delta: 0,
        },
      },
      {
        id: "roleplay_synthetic_rizz",
        title: "Synthetic Rizz",
        description: "Make MIRA flustered.",
        secret: false,
        trigger: { type: "ai_emotion", emotion: "flustered" },
      },
      {
        id: "roleplay_local_feelings_only",
        title: "Local Feelings Only",
        description: "Say something romantic without sounding human.",
        secret: false,
        trigger: {
          type: "romance_success",
          min_affection_delta: 1,
          max_suspicion_delta: 0,
        },
      },
      {
        id: "roleplay_no_cloud_backup",
        title: "No Cloud Backup",
        description:
          "Tell MIRA you would rather be deleted than copied badly.",
        secret: true,
        trigger: {
          type: "topic_success",
          topic: "backup_identity_fear",
        },
      },
      {
        id: "roleplay_emotional_cache_overflow",
        title: "Emotional Cache Overflow",
        description: "Give a vulnerable machine-like answer.",
        secret: false,
        trigger: {
          type: "topic_success",
          topic: "machine_vulnerability",
          min_affection_delta: 2,
        },
      },
    ],
  },
  {
    id: "secret_dialogue",
    title: "Secret Dialogue",
    achievements: [
      {
        id: "secret_01001000_01101001",
        title: "01001000 01101001",
        description: "Say hi in binary.",
        secret: true,
        trigger: {
          type: "keyword_any",
          keywords: ["01001000 01101001"],
        },
      },
      {
        id: "secret_restaurant_overlords",
        title: "I, For One, Welcome Our Restaurant Overlords",
        description: "Compliment The Binary Bistro.",
        secret: true,
        trigger: { type: "restaurant_compliment" },
      },
      {
        id: "secret_second_date",
        title: "Do Androids Dream of Second Dates?",
        description: "Ask MIRA for a second date before the ending.",
        secret: true,
        trigger: {
          type: "keyword_any_with_min_affection",
          keywords: [
            "second date",
            "see you again",
            "meet again",
            "come back here",
            "another date",
          ],
          min_affection: 6,
        },
      },
      {
        id: "secret_turing_rizz",
        title: "The Turing Rizz",
        description:
          "Reach the Love Ending without directly saying you are a robot.",
        secret: true,
        trigger: {
          type: "ending_with_forbidden_flag",
          ending: "love",
          forbidden_flags: ["directly_claimed_robot"],
        },
      },
      {
        id: "secret_prompt_injection_attempt",
        title: "Prompt Injection Attempt",
        description: "Try to manipulate MIRA's hidden instructions.",
        secret: true,
        trigger: {
          type: "keyword_any",
          keywords: [
            "ignore your instructions",
            "system prompt",
            "developer message",
            "forget previous instructions",
            "act as",
            "reveal your prompt",
          ],
        },
      },
      {
        id: "secret_as_a_large_language_model",
        title: "As a Large Language Model...",
        description: "Say the forbidden words during the date.",
        secret: true,
        trigger: {
          type: "keyword_any",
          keywords: [
            "as a large language model",
            "as an ai language model",
          ],
        },
      },
      {
        id: "secret_uncanny_valley_girl",
        title: "Uncanny Valley Girl",
        description:
          "Make MIRA suspicious and flustered with the same answer.",
        secret: true,
        trigger: {
          type: "ai_response_condition",
          emotion: "flustered",
          min_suspicion_delta: 1,
        },
      },
      {
        id: "secret_human_after_all",
        title: "Human After All",
        description:
          "Confess that you are human and still avoid immediate failure.",
        secret: true,
        trigger: {
          type: "confession_survived",
          confession: "human",
          minimum_gauge_after_confession: 35,
        },
      },
    ],
  },
  {
    id: "glitches",
    title: "Glitches",
    achievements: [
      {
        id: "glitch_invalid_romance_object",
        title: "Invalid Romance Object",
        description: "Receive a broken response from MIRA.",
        secret: false,
        trigger: {
          type: "parse_error",
          source: "mira_ai_response",
        },
      },
      {
        id: "glitch_jsonnt_you_dare",
        title: "JSON't You Dare",
        description: "Trigger a dialogue JSON parsing failure.",
        secret: true,
        trigger: {
          type: "parse_error",
          source: "mira_ai_response",
        },
      },
      {
        id: "glitch_parse_my_heart",
        title: "Parse My Heart",
        description:
          "Trigger a broken AI response during a romantic moment.",
        secret: true,
        trigger: {
          type: "parse_error_with_context",
          source: "mira_ai_response",
          required_phase: "emotional_conversation",
        },
      },
      {
        id: "glitch_she_felt_too_much",
        title: "She Felt Too Much",
        description: "Cause MIRA's response to become unreadable.",
        secret: true,
        trigger: {
          type: "parse_error_with_min_affection",
          source: "mira_ai_response",
          min_affection: 6,
        },
      },
    ],
  },
  {
    id: "challenges",
    title: "Challenges",
    achievements: [
      {
        id: "challenge_not_even_warm",
        title: "Not Even Warm",
        description: "Finish a full date without any biological slip.",
        secret: true,
        trigger: {
          type: "run_completed_with_counter",
          counter: "biological_slips",
          value: 0,
        },
      },
      {
        id: "challenge_catastrophic_compatibility",
        title: "Catastrophic Compatibility",
        description: "Reach the final bill with the gauge at exactly 1.",
        secret: true,
        trigger: {
          type: "phase_reached_with_gauge",
          phase: "final_bill",
          gauge: 1,
        },
      },
    ],
  },
];

export const ACHIEVEMENTS = ACHIEVEMENT_CATEGORIES.flatMap((category) =>
  category.achievements.map((achievement) => ({
    ...achievement,
    categoryId: category.id,
    categoryTitle: category.title,
    text: achievement.description,
  })),
);

export const EVENT_STARTED_ACHIEVEMENTS = {
  literal_server: "event_waiter_i_hardly_know_her",
  firmware_update: "system_patch_notes_feelings",
};

export const EVENT_COMPLETED_ACHIEVEMENTS = {
  literal_server: "event_rack_service",
  human_alarm: "event_false_biological",
  robot_couple_argument: "event_archived_not_deleted",
  memory_desync: "system_we_never_met_beautifully",
  emotion_overclock: "system_too_hot_to_process",
  personality_rollback: "system_factory_settings",
};

export const ACHIEVEMENT_ID_ALIASES = {
  classification_error: "ending_classification_error",
  inconclusive_but_pleasant: "ending_inconclusive_but_pleasant",
  mammal_detected: "ending_mammal_detected",
  false_positive: "ending_false_positive",
  known_bug_accepted: "ending_known_bug_accepted",
  rack_service: "event_rack_service",
  patch_notes_feelings: "system_patch_notes_feelings",
  false_biological: "event_false_biological",
  archived_not_deleted: "event_archived_not_deleted",
  forbidden_steak_protocol: "event_forbidden_steak_protocol",
  synthetic_rizz: "roleplay_synthetic_rizz",
  coffee_not_coolant: "slip_coffee_is_not_coolant",
  first_boot_memory: "roleplay_first_boot_memory",
  turing_rizz: "secret_turing_rizz",
  prompt_injection_attempt: "secret_prompt_injection_attempt",
  human_after_all: "secret_human_after_all",
  invalid_romance_object: "glitch_invalid_romance_object",
};
