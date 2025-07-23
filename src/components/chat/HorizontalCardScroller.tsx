import DynamicCard from './DynamicCard';

interface HorizontalCardScrollerProps {
  identifiers: string[];
}

export default function HorizontalCardScroller({ identifiers }: HorizontalCardScrollerProps) {
  return (
    <div
      style={{
        width: '100%',
        overflowX: 'auto',
        overflowY: 'hidden',
        margin: '16px 0',
        paddingBottom: '10px'
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: '16px',
          width: 'fit-content'
        }}
      >
        {identifiers.map((identifier, index) => (
          <div
            key={`${identifier}-${index}`}
            style={{
              width: '320px',
              flexShrink: 0
            }}
          >
            <DynamicCard identifier={identifier} />
          </div>
        ))}
      </div>
    </div>
  );
} 