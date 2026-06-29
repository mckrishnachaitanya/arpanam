import { useState } from 'react'

const EMOJI_CATEGORIES = [
  {
    label: 'People & Family',
    icon: '👨‍👩‍👧',
    emojis: ['👨‍👩‍👧', '👨‍👩‍👦', '👪', '👴', '👵', '👨', '👩', '👦', '👧', '🧑', '👶', '🧓', '🙏', '🤝', '❤️', '💑', '👫', '🫂', '💪', '🧘', '🏃', '🚶']
  },
  {
    label: 'Home & Places',
    icon: '🏠',
    emojis: ['🏠', '🏡', '🏘', '🏗', '🏢', '🏥', '🏦', '🏨', '🏪', '🏫', '🏬', '🏯', '🏰', '⛪', '🕌', '🕍', '🛕', '⛩', '🕋', '⛺', '🏕', '🌆', '🌇', '🌃', '🌉']
  },
  {
    label: 'Money & Finance',
    icon: '💰',
    emojis: ['💰', '💵', '💴', '💶', '💷', '💸', '💳', '🪙', '💹', '📈', '📉', '🏧', '💲', '🤑', '💎', '🏦', '📊', '🧾', '💼', '👜', '🎁', '🛍', '🏷', '🔖']
  },
  {
    label: 'Spiritual',
    icon: '🕉',
    emojis: ['🕉', '☸', '✝', '☦', '🛐', '🙏', '📿', '🪬', '🔯', '🕌', '🛕', '⛪', '🕍', '🕋', '☪', '✡', '🪷', '🌸', '🌺', '🌻', '🌼', '💐', '🪔', '🕯', '🔔', '🏮']
  },
  {
    label: 'Health & Care',
    icon: '❤️‍🩹',
    emojis: ['❤️‍🩹', '🏥', '💊', '💉', '🩺', '🩹', '🩻', '🧬', '🔬', '🧪', '🫀', '🧠', '💆', '💇', '🛁', '🚿', '🧴', '🧼', '🌡', '🏋', '🤸', '🧗', '🚴']
  },
  {
    label: 'Food & Dining',
    icon: '🍽',
    emojis: ['🍽', '🍲', '🥘', '🍛', '🍜', '🍝', '🍱', '🍣', '🥗', '🥙', '🌮', '🌯', '🍔', '🍟', '🍕', '🍗', '🥚', '🍳', '🥞', '🧇', '🫕', '☕', '🍵', '🥤']
  },
  {
    label: 'Transport',
    icon: '✈️',
    emojis: ['✈️', '🚗', '🚕', '🚙', '🚌', '🏎', '🚓', '🚑', '🚒', '🛻', '🚚', '🚜', '🏍', '🛵', '🚲', '🛴', '🚁', '🛸', '⛵', '🚂', '🚆', '🚇', '🧳', '🏖', '🏔']
  },
  {
    label: 'Education & Work',
    icon: '📚',
    emojis: ['📚', '📖', '📝', '✏️', '🖊', '📓', '📔', '📒', '📕', '📗', '📘', '📙', '📄', '📊', '📈', '💻', '🖥', '📱', '📞', '🏫', '🎓', '🏆', '🥇', '🎯']
  },
  {
    label: 'Tools & Service',
    icon: '🔧',
    emojis: ['🔧', '🔨', '⚒', '🛠', '⛏', '🔩', '🪛', '🔑', '🗝', '🪚', '🪝', '🧰', '⚙️', '🧲', '🪜', '🧹', '🧺', '🧻', '🪣', '💡', '🔦', '🕯', '🔋', '🔌']
  },
  {
    label: 'Nature',
    icon: '🌿',
    emojis: ['🌿', '🌱', '🌲', '🌳', '🌴', '🌵', '🎋', '🍀', '🍃', '🍂', '🍁', '🌾', '🌺', '🌸', '🌼', '🌻', '🌹', '🌷', '🪷', '🍄', '🌰', '🐾', '🐕', '🐈', '🐘', '🦁']
  },
  {
    label: 'Symbols',
    icon: '⭐',
    emojis: ['⭐', '🌟', '✨', '💫', '🔥', '❄️', '🌈', '☀️', '🌙', '⚡', '🎯', '🎨', '🎬', '🎤', '🎵', '🎶', '🎸', '🎹', '🎲', '🎮', '📦', '📁', '🗂', '📌', '📍']
  },
]

export default function EmojiPicker({ onSelect, onClose }) {
  const [activeCategory, setActiveCategory] = useState(0)

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.sheet} onClick={e => e.stopPropagation()}>
        <div style={s.header}>
          <div style={s.title}>Pick an icon</div>
          <button onClick={onClose} style={s.closeBtn}>✕</button>
        </div>

        {/* Category tabs */}
        <div style={s.tabs}>
          {EMOJI_CATEGORIES.map((cat, i) => (
            <button key={i} onClick={() => setActiveCategory(i)}
              style={{ ...s.tab, ...(activeCategory === i ? s.tabActive : {}) }}
              title={cat.label}>
              {cat.icon}
            </button>
          ))}
        </div>

        <div style={s.categoryLabel}>{EMOJI_CATEGORIES[activeCategory].label}</div>

        {/* Emoji grid */}
        <div style={s.grid}>
          {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji, i) => (
            <button key={i} onClick={() => { onSelect(emoji); onClose() }} style={s.emojiBtn}>
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

const s = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
    zIndex: 200, display: 'flex', alignItems: 'flex-end',
  },
  sheet: {
    background: '#130f00', borderTop: '1px solid #2a2010',
    borderRadius: '20px 20px 0 0', width: '100%',
    maxHeight: '70dvh', display: 'flex', flexDirection: 'column',
    paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 20px 8px', flexShrink: 0,
  },
  title: { fontSize: 15, fontWeight: 700, color: '#fde047' },
  closeBtn: { background: 'none', border: 'none', color: '#6b5a30', fontSize: 18, cursor: 'pointer' },
  tabs: {
    display: 'flex', gap: 4, padding: '0 16px 8px',
    overflowX: 'auto', scrollbarWidth: 'none', flexShrink: 0,
  },
  tab: {
    background: 'transparent', border: '1px solid transparent',
    borderRadius: 8, padding: '6px 8px', fontSize: 20,
    cursor: 'pointer', flexShrink: 0,
    WebkitTapHighlightColor: 'transparent',
  },
  tabActive: { background: '#2a2010', borderColor: '#ca8a04' },
  categoryLabel: {
    fontSize: 11, color: '#6b5a30', fontWeight: 600,
    letterSpacing: '0.5px', textTransform: 'uppercase',
    padding: '0 20px 8px', flexShrink: 0,
  },
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
    gap: 4, padding: '0 16px', overflowY: 'auto',
  },
  emojiBtn: {
    background: 'none', border: 'none', fontSize: 26,
    padding: '8px 4px', cursor: 'pointer', borderRadius: 8,
    WebkitTapHighlightColor: 'transparent',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
}
