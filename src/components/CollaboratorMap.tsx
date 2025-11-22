interface CollaboratorMapProps {
  latitude: number;
  longitude: number;
  name: string;
}

export function CollaboratorMap({ latitude, longitude, name }: CollaboratorMapProps) {
  // Usar OpenStreetMap via iframe (não requer API key)
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.01},${latitude - 0.01},${longitude + 0.01},${latitude + 0.01}&layer=mapnik&marker=${latitude},${longitude}`;

  return (
    <div className="relative w-full h-[300px] rounded-lg overflow-hidden border border-border shadow-md">
      <iframe
        title={`Localização de ${name}`}
        src={mapUrl}
        className="absolute inset-0 w-full h-full"
        style={{ border: 0 }}
        loading="lazy"
      />
    </div>
  );
}
