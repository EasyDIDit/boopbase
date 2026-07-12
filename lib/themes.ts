export interface Theme {
  id: string;
  name: string;
  description: string;
  
  buttonClass: string;
  addToContactsClass: string;
  socialIconClass: string;
  
  '--primary': string;
  '--accent': string;
  '--text': string;
  '--card-bg': string;
  '--button-border': string;
  '--shadow': string;
  
  profileContainerClass?: string;
  contentAreaClass?: string;
}

export const themes = [
  {
    id: 'boop-classic',
    name: 'Boop Classic',
    description: 'Bold 1930s Betty Boop style',
    buttonClass: "bg-white text-black border-[4px] border-black hover:bg-yellow-300 active:bg-yellow-400 shadow-[3px_3px_0_0_#000] font-bold rounded-2xl",
    addToContactsClass: "bg-[#E72679] text-white border-[3px] border-black hover:bg-pink-600 active:bg-pink-700 shadow-[2px_2px_0_0_#000] font-bold rounded-xl text-sm py-2.5 px-6 flex items-center gap-2",
    socialIconClass: "w-11 h-11 rounded-full border-[3px] border-black bg-white flex items-center justify-center text-xl shadow-[2px_2px_0_0_#000] hover:scale-110 transition-all",
    '--primary': '#E72679',
    '--accent': '#FCCC82',
    '--text': '#000000',
    '--card-bg': '#ffffff',
    '--button-border': '#000000',
    '--shadow': '3px 3px 0 0 #000',
    contentAreaClass: 'bg-white/95',
  },
  {
    id: 'cat',
    name: 'Cat',
    description: 'Playful cartoon cat',
    buttonClass: "bg-[#FF6B6B] text-white border-[4px] border-black hover:bg-[#FF8787] active:bg-[#FF5252] shadow-[3px_3px_0_0_#000] font-bold rounded-2xl",
    addToContactsClass: "bg-[#4ECDC4] text-white border-[3px] border-black hover:bg-[#6BD9D2] active:bg-[#3DB9B1] shadow-[2px_2px_0_0_#000] font-bold rounded-xl text-sm py-2.5 px-6 flex items-center gap-2",
    socialIconClass: "w-11 h-11 rounded-full border-[3px] border-black bg-white flex items-center justify-center text-xl shadow-[2px_2px_0_0_#000] hover:scale-110 transition-all",
    '--primary': '#FF6B6B',
    '--accent': '#4ECDC4',
    '--text': '#000000',
    '--card-bg': '#FFF8F0',
    '--button-border': '#000000',
    '--shadow': '3px 3px 0 0 #000',
    contentAreaClass: 'bg-white/95',
  },
  {
    id: 'jazz-night',
    name: 'Jazz Night',
    description: 'Sultry 1930s jazz club',
    buttonClass: "bg-[#2E2E2E] text-white border-[4px] border-[#FFD700] hover:bg-[#1F1F1F] active:bg-[#111111] shadow-[3px_3px_0_0_#FFD700] font-bold rounded-2xl",
    addToContactsClass: "bg-[#FFD700] text-black border-[3px] border-black hover:bg-[#FFED4E] active:bg-[#E38C4A] shadow-[2px_2px_0_0_#000] font-bold rounded-xl text-sm py-2.5 px-6 flex items-center gap-2",
    socialIconClass: "w-11 h-11 rounded-full border-[3px] border-[#FFD700] bg-[#2E2E2E] flex items-center justify-center text-xl shadow-[2px_2px_0_0_#FFD700] hover:scale-110 transition-all",
    '--primary': '#FFD700',
    '--accent': '#FF4500',
    '--text': '#ffffff',
    '--card-bg': '#1A1A1A',
    '--button-border': '#FFD700',
    '--shadow': '3px 3px 0 0 #FFD700',
    contentAreaClass: 'bg-white/95',
  },
  {
    id: 'vintage-car',
    name: 'Vintage Car',
    description: 'Classic 1930s rubber-hose car',
    buttonClass: "bg-[#E63946] text-white border-[4px] border-black hover:bg-[#F25C6A] active:bg-[#C92A3A] shadow-[3px_3px_0_0_#000] font-bold rounded-2xl",
    addToContactsClass: "bg-[#457B9D] text-white border-[3px] border-black hover:bg-[#5A9BC4] active:bg-[#3A6580] shadow-[2px_2px_0_0_#000] font-bold rounded-xl text-sm py-2.5 px-6 flex items-center gap-2",
    socialIconClass: "w-11 h-11 rounded-full border-[3px] border-black bg-white flex items-center justify-center text-xl shadow-[2px_2px_0_0_#000] hover:scale-110 transition-all",
    '--primary': '#E63946',
    '--accent': '#457B9D',
    '--text': '#000000',
    '--card-bg': '#FFF8F0',
    '--button-border': '#000000',
    '--shadow': '3px 3px 0 0 #000',
    contentAreaClass: 'bg-white/95',
  },
  {
    id: 'night-city',
    name: 'Night City',
    description: 'Playful 1930s cartoon city at night',
    buttonClass: "bg-[#1D3557] text-white border-[4px] border-[#A8DADC] hover:bg-[#0D2537] active:bg-[#0A1F2E] shadow-[3px_3px_0_0_#A8DADC] font-bold rounded-2xl",
    addToContactsClass: "bg-[#F4A261] text-black border-[3px] border-black hover:bg-[#F9C17A] active:bg-[#E38C4A] shadow-[2px_2px_0_0_#000] font-bold rounded-xl text-sm py-2.5 px-6 flex items-center gap-2",
    socialIconClass: "w-11 h-11 rounded-full border-[3px] border-black bg-white flex items-center justify-center text-xl shadow-[2px_2px_0_0_#000] hover:scale-110 transition-all",
    '--primary': '#1D3557',
    '--accent': '#F4A261',
    '--text': '#ffffff',
    '--card-bg': '#0D2537',
    '--button-border': '#A8DADC',
    '--shadow': '3px 3px 0 0 #A8DADC',
    contentAreaClass: 'bg-white/95',
  },
];

export const getThemeById = (id: string) => {
  return themes.find(t => t.id === id) || themes[0];
};