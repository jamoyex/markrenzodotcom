import ProfileCard from './ProfileCard';
import CircularGallery from './CircularGallery';

export default function AboutCard() {
  const handleContactClick = () => {
    window.open('https://www.instagram.com/jamoyex/', '_blank', 'noopener,noreferrer');
  };

  return (
    <div style={{ 
      width: '100%',
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0rem',
      padding: '0.5rem 0',
      margin: '1.5rem 0',
      position: 'relative',
      zIndex: 1
    }}>
      <ProfileCard
        avatarUrl="/src/assets/images/markrenzosquare.png"
        grainUrl="/src/assets/images/grain.webp"
        name="Mark Renzo"
        title="Creative Technologist & AI Specialist"
        handle="jamoyex"
        status="Follow me on IG"
        contactText="Get in Touch"
        showUserInfo={true}
        enableTilt={true}
        enableMobileTilt={true}
        onContactClick={handleContactClick}
      />
      
      <div style={{ width: '100%', marginTop: '0rem' }}>
        <CircularGallery 
          bend={0}
          borderRadius={0.05}
          scrollSpeed={1.5}
          scrollEase={0.05}
          font={'normal 30px "Montserrat", system-ui, -apple-system, sans-serif'}
          items={[
            { thumb: '/src/assets/images/forestcitymalaysia.jpg', href: 'https://pages.markrenzo.com/media/Snapinsta.app_video_An8AbHKOuJ9VuOY5cHV_Qb7ibnYPw5IjwMEFQVzAO961vc8LQx51AJAFvDqWAdaiq6l3Dk7zSbHdyt4dgKMI0o4.mp4', text: 'Forest City Malaysia' },
            { thumb: '/src/assets/images/solotravel.jpg', href: 'https://pages.markrenzo.com/media/Snapinsta.app_video_An8EXcgMgp6yHFUfPvbVc3pZ-RVbgQFJQo0q7snBr8BXySAh8_zw4AtpdhPfq8l8FhZPqaTDJs8EttSKg7QD4x6R.mp4', text: 'Solo Travel' },
            { thumb: '/src/assets/images/gaminghotel.jpg', href: 'https://pages.markrenzo.com/media/Snapinsta.app_video_An9_3U3c5ITMd4RbbrAG3E9Y_QeaAInxsVie3WvOybRjFV952SFh71EhYiHycP1XUGjP4dJRQ1ZsbU1UUX32zMjf.mp4', text: 'Gaming Hotel' },
            { thumb: '/src/assets/images/grampians.jpg', href: 'https://pages.markrenzo.com/media/Snapinsta.app_video_D0459294601A98F928D3907BEC3CA9AC_video_dashinit.mp4', text: 'Grampians' },
          ]}
          onItemClick={({ image, text, index }) => {
            const event = new CustomEvent('open-lightbox', {
              detail: { index, image, text }
            });
            window.dispatchEvent(event);
          }}
        />
      </div>
    </div>
  );
} 