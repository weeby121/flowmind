export const MOCK_GRAPH = {
  title: "Photosynthesis Overview",
  summary: "A process used by plants to convert light energy into chemical energy.",
  nodes: [
    { id: '1', label: 'Light Absorption', summary: 'Chlorophyll absorbs sunlight.', type: 'concept' },
    { id: '2', label: 'Water Splitting', summary: 'H2O is divided into Oxygen and Electrons.', type: 'concept' },
    { id: '3', label: 'ATP Production', summary: 'Energy is stored in ATP molecules.', type: 'concept' },
  ],
  edges: [
    { id: 'e1-2', source: '1', target: '2', relation: 'triggers' },
    { id: 'e2-3', source: '2', target: '3', relation: 'leads_to' },
  ]
};