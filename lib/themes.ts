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

const social = (border: string, bg: string, shadow: string) =>
  `w-11 h-11 rounded-full border-[3px] border-[${border}] bg-[${bg}] flex items-center justify-center text-xl shadow-[2px_2px_0_0_${shadow}] hover:scale-110 transition-all`;

export const themes: Theme[] = [
  {
    id: 'boop-classic',
    name: 'Boop Classic',
    description: 'Bold 1930s Betty Boop style',
    buttonClass: 'bg-white text-black border-[4px] border-black hover:bg-yellow-300 shadow-[3px_3px_0_0_#000] font-bold rounded-2xl',
    addToContactsClass: 'bg-[#E72679] text-white border-[3px] border-black hover:bg-pink-600 shadow-[2px_2px_0_0_#000] font-bold rounded-xl text-sm py-2.5 px-6 flex items-center gap-2',
    socialIconClass: 'w-11 h-11 rounded-full border-[3px] border-black bg-white flex items-center justify-center text-xl shadow-[2px_2px_0_0_#000] hover:scale-110 transition-all',
    '--primary': '#E72679', '--accent': '#FCCC82', '--text': '#000000', '--card-bg': '#ffffff', '--button-border': '#000000', '--shadow': '3px 3px 0 0 #000',
    contentAreaClass: '',
  },
  {
    id: 'jazz-night',
    name: 'Jazz Night',
    description: 'Sultry 1930s jazz club',
    buttonClass: 'bg-[#2E2E2E] text-white border-[4px] border-[#FFD700] shadow-[3px_3px_0_0_#FFD700] font-bold rounded-2xl',
    addToContactsClass: 'bg-[#FFD700] text-black border-[3px] border-black shadow-[2px_2px_0_0_#000] font-bold rounded-xl text-sm py-2.5 px-6 flex items-center gap-2',
    socialIconClass: 'w-11 h-11 rounded-full border-[3px] border-[#FFD700] bg-[#2E2E2E] flex items-center justify-center text-xl shadow-[2px_2px_0_0_#FFD700] hover:scale-110 transition-all',
    '--primary': '#FFD700', '--accent': '#FF4500', '--text': '#ffffff', '--card-bg': '#1A1A1A', '--button-border': '#FFD700', '--shadow': '3px 3px 0 0 #FFD700',
    contentAreaClass: '',
  },
  {
    id: 'night-city',
    name: 'Night City',
    description: 'Playful cartoon city at night',
    buttonClass: 'bg-[#1D3557] text-white border-[4px] border-[#A8DADC] shadow-[3px_3px_0_0_#A8DADC] font-bold rounded-2xl',
    addToContactsClass: 'bg-[#F4A261] text-black border-[3px] border-black shadow-[2px_2px_0_0_#000] font-bold rounded-xl text-sm py-2.5 px-6 flex items-center gap-2',
    socialIconClass: 'w-11 h-11 rounded-full border-[3px] border-[#00F0FF] bg-[#0A1525] flex items-center justify-center text-xl shadow-[2px_2px_0_0_#00F0FF] hover:scale-110 transition-all',
    '--primary': '#00F0FF', '--accent': '#F4A261', '--text': '#ffffff', '--card-bg': '#0A1525', '--button-border': '#A8DADC', '--shadow': '3px 3px 0 0 #A8DADC',
    contentAreaClass: '',
  },
  {
    id: 'pink-cabaret',
    name: 'Pink Cabaret',
    description: 'Stage lights and blush',
    buttonClass: 'bg-[#FFF0F5] text-[#18152E] border-[4px] border-black shadow-[3px_3px_0_0_#000] font-bold rounded-2xl',
    addToContactsClass: 'bg-[#E72679] text-white border-[3px] border-black shadow-[2px_2px_0_0_#000] font-bold rounded-xl text-sm py-2.5 px-6 flex items-center gap-2',
    socialIconClass: 'w-11 h-11 rounded-full border-[3px] border-black bg-[#FFF0F5] flex items-center justify-center text-xl shadow-[2px_2px_0_0_#000] hover:scale-110 transition-all',
    '--primary': '#E72679', '--accent': '#FCCC82', '--text': '#18152E', '--card-bg': '#FFF0F5', '--button-border': '#000000', '--shadow': '3px 3px 0 0 #000',
    contentAreaClass: '',
  },
  {
    id: 'soda-sky',
    name: 'Soda Sky',
    description: 'Bright blue pop',
    buttonClass: 'bg-white text-[#18152E] border-[4px] border-[#18152E] shadow-[3px_3px_0_0_#18152E] font-bold rounded-2xl',
    addToContactsClass: 'bg-[#3EBEEF] text-white border-[3px] border-[#18152E] shadow-[2px_2px_0_0_#18152E] font-bold rounded-xl text-sm py-2.5 px-6 flex items-center gap-2',
    socialIconClass: 'w-11 h-11 rounded-full border-[3px] border-[#18152E] bg-white flex items-center justify-center text-xl shadow-[2px_2px_0_0_#18152E] hover:scale-110 transition-all',
    '--primary': '#3EBEEF', '--accent': '#FCCC82', '--text': '#18152E', '--card-bg': '#FFFFFF', '--button-border': '#18152E', '--shadow': '3px 3px 0 0 #18152E',
    contentAreaClass: '',
  },
  {
    id: 'butter-cream',
    name: 'Butter Cream',
    description: 'Warm yellow cream',
    buttonClass: 'bg-[#FFF8E7] text-[#18152E] border-[4px] border-black shadow-[3px_3px_0_0_#000] font-bold rounded-2xl',
    addToContactsClass: 'bg-[#E8A84A] text-black border-[3px] border-black shadow-[2px_2px_0_0_#000] font-bold rounded-xl text-sm py-2.5 px-6 flex items-center gap-2',
    socialIconClass: 'w-11 h-11 rounded-full border-[3px] border-black bg-[#FFF8E7] flex items-center justify-center text-xl shadow-[2px_2px_0_0_#000] hover:scale-110 transition-all',
    '--primary': '#E8A84A', '--accent': '#E72679', '--text': '#18152E', '--card-bg': '#FFF8E7', '--button-border': '#000000', '--shadow': '3px 3px 0 0 #000',
    contentAreaClass: '',
  },
  {
    id: 'ink-noir',
    name: 'Ink Noir',
    description: 'High-contrast black and white',
    buttonClass: 'bg-[#111111] text-white border-[4px] border-white shadow-[3px_3px_0_0_#C4CFDA] font-bold rounded-2xl',
    addToContactsClass: 'bg-[#E72679] text-white border-[3px] border-white shadow-[2px_2px_0_0_#C4CFDA] font-bold rounded-xl text-sm py-2.5 px-6 flex items-center gap-2',
    socialIconClass: 'w-11 h-11 rounded-full border-[3px] border-white bg-[#111] flex items-center justify-center text-xl shadow-[2px_2px_0_0_#C4CFDA] hover:scale-110 transition-all',
    '--primary': '#E72679', '--accent': '#C4CFDA', '--text': '#ffffff', '--card-bg': '#111111', '--button-border': '#FFFFFF', '--shadow': '3px 3px 0 0 #C4CFDA',
    contentAreaClass: '',
  },
  {
    id: 'mint-soda',
    name: 'Mint Soda',
    description: 'Fresh mint fizz',
    buttonClass: 'bg-[#E8FFF6] text-[#0F3D3E] border-[4px] border-[#0F3D3E] shadow-[3px_3px_0_0_#0F3D3E] font-bold rounded-2xl',
    addToContactsClass: 'bg-[#2EC4B6] text-white border-[3px] border-[#0F3D3E] shadow-[2px_2px_0_0_#0F3D3E] font-bold rounded-xl text-sm py-2.5 px-6 flex items-center gap-2',
    socialIconClass: 'w-11 h-11 rounded-full border-[3px] border-[#0F3D3E] bg-[#E8FFF6] flex items-center justify-center text-xl shadow-[2px_2px_0_0_#0F3D3E] hover:scale-110 transition-all',
    '--primary': '#2EC4B6', '--accent': '#0F3D3E', '--text': '#0F3D3E', '--card-bg': '#E8FFF6', '--button-border': '#0F3D3E', '--shadow': '3px 3px 0 0 #0F3D3E',
    contentAreaClass: '',
  },
  {
    id: 'ruby-lounge',
    name: 'Ruby Lounge',
    description: 'Deep red lounge',
    buttonClass: 'bg-[#2A0E14] text-white border-[4px] border-[#C41E3A] shadow-[3px_3px_0_0_#C41E3A] font-bold rounded-2xl',
    addToContactsClass: 'bg-[#C41E3A] text-white border-[3px] border-[#FCCC82] shadow-[2px_2px_0_0_#FCCC82] font-bold rounded-xl text-sm py-2.5 px-6 flex items-center gap-2',
    socialIconClass: 'w-11 h-11 rounded-full border-[3px] border-[#C41E3A] bg-[#2A0E14] flex items-center justify-center text-xl shadow-[2px_2px_0_0_#C41E3A] hover:scale-110 transition-all',
    '--primary': '#C41E3A', '--accent': '#FCCC82', '--text': '#ffffff', '--card-bg': '#2A0E14', '--button-border': '#C41E3A', '--shadow': '3px 3px 0 0 #C41E3A',
    contentAreaClass: '',
  },
  {
    id: 'paper-kraft',
    name: 'Paper Kraft',
    description: 'Craft paper analog',
    buttonClass: 'bg-[#F5E6D3] text-[#3E2723] border-[4px] border-[#3E2723] shadow-[3px_3px_0_0_#3E2723] font-bold rounded-2xl',
    addToContactsClass: 'bg-[#8D6E63] text-white border-[3px] border-[#3E2723] shadow-[2px_2px_0_0_#3E2723] font-bold rounded-xl text-sm py-2.5 px-6 flex items-center gap-2',
    socialIconClass: 'w-11 h-11 rounded-full border-[3px] border-[#3E2723] bg-[#F5E6D3] flex items-center justify-center text-xl shadow-[2px_2px_0_0_#3E2723] hover:scale-110 transition-all',
    '--primary': '#8D6E63', '--accent': '#E72679', '--text': '#3E2723', '--card-bg': '#F5E6D3', '--button-border': '#3E2723', '--shadow': '3px 3px 0 0 #3E2723',
    contentAreaClass: '',
  },
];

export const getThemeById = (id: string) => themes.find((t) => t.id === id) || themes[0];
