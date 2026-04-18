export function ogTemplate(title: string, subtitle: string) {
  return {
    type: 'div',
    props: {
      style: {
        height: '100%', width: '100%',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', padding: '60px',
        background: '#ffffff', color: '#1f2328',
        fontFamily: 'system-ui',
      },
      children: [
        {
          type: 'div', props: {
            style: { fontSize: 18, letterSpacing: 3, color: '#8c959f', textTransform: 'uppercase' },
            children: 'kiran.danduprolu.com',
          },
        },
        {
          type: 'div', props: {
            style: { display: 'flex', flexDirection: 'column', gap: 16 },
            children: [
              { type: 'div', props: { style: { fontSize: 64, fontWeight: 700, letterSpacing: -1, lineHeight: 1.1 }, children: title } },
              { type: 'div', props: { style: { fontSize: 24, color: '#656d76' }, children: subtitle } },
            ],
          },
        },
        {
          type: 'div', props: {
            style: { display: 'flex', alignItems: 'center', gap: 14 },
            children: [
              { type: 'div', props: { style: { width: 36, height: 36, borderRadius: 18, background: 'linear-gradient(135deg,#0969da,#8250df)' } } },
              { type: 'div', props: { style: { fontSize: 20, fontWeight: 600 }, children: 'Kiran Danduprolu' } },
            ],
          },
        },
      ],
    },
  };
}
