export const PROVINCES = [
    { value: 'bangkok', label: 'กรุงเทพมหานคร' },
    { value: 'chiangmai', label: 'เชียงใหม่' },
    { value: 'phuket', label: 'ภูเก็ต' },
    { value: 'chonburi', label: 'ชลบุรี' },
    { value: 'krabi', label: 'กระบี่' },
    { value: 'suratthani', label: 'สุราษฎร์ธานี' },
    { value: 'songkhla', label: 'สงขลา' },
    { value: 'khonkaen', label: 'ขอนแก่น' },
    { value: 'korat', label: 'นครราชสีมา' },
    { value: 'udonthani', label: 'อุดรธานี' },
    { value: 'rayong', label: 'ระยอง' },
    { value: 'prachuap', label: 'ประจวบคีรีขันธ์ (หัวหิน)' },
    { value: 'phetchaburi', label: 'เพชรบุรี (ชะอำ)' },
    { value: 'kanchanaburi', label: 'กาญจนบุรี' },
    { value: 'ayutthaya', label: 'พระนครศรีอยุธยา' },
    // Add more as needed
].sort((a, b) => a.label.localeCompare(b.label, 'th'));
