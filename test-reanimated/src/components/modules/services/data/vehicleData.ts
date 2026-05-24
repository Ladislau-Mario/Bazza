export const vehicleData = {
  marcas: [
    { id: '1', name: 'Honda' },
    { id: '2', name: 'Suzuki' },
    { id: '3', name: 'Kawasaki' },
    { id: '4', name: 'Yamaha' },
    { id: '5', name: 'Lingken' },
    { id: '6', name: 'Dayun' },
    { id: '7', name: 'Haojin' },
  ],
  cores: [
    { id: '1', name: 'Preto', hex: '#000000' },
    { id: '2', name: 'Vermelho', hex: '#FF0000' },
    { id: '3', name: 'Azul', hex: '#0000FF' },
    { id: '4', name: 'Branco', hex: '#FFFFFF' },
    { id: '5', name: 'Cinza', hex: '#808080' },
  ],
  modelos: {
    'Honda': ['CG 125', 'CB 125', 'Biz 125', 'Elite 125'],
    'Suzuki': ['GN 125', 'Yes 125', 'AX 100'],
    'Lingken': ['LK 125', 'LK 150'],
    'Haojin': ['HJ 125', 'HJ 150'],
    // Adicionamos mais conforme necessário
  }
};