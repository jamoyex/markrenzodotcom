import ProfileCard from './ProfileCard';
import CircularGallery from './CircularGallery';
import avatarImg from '@/assets/images/markrenzosquare.png';
import grainImg from '@/assets/images/grain.webp';
import imgForest from '@/assets/images/forestcitymalaysia.jpg';
import imgSolo from '@/assets/images/solotravel.jpg';
import imgGaming from '@/assets/images/gaminghotel.jpg';
import imgGrampians from '@/assets/images/grampians.jpg';

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
        avatarUrl={avatarImg}
        grainUrl={grainImg}
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
          scrollSpeed={2.5}
          scrollEase={0.05}
          font={'normal 30px "Montserrat", system-ui, -apple-system, sans-serif'}
          items={[
            { thumb: imgForest, href: 'https://pages.markrenzo.com/media/Snapinsta.app_video_An8AbHKOuJ9VuOY5cHV_Qb7ibnYPw5IjwMEFQVzAO961vc8LQx51AJAFvDqWAdaiq6l3Dk7zSbHdyt4dgKMI0o4.mp4', text: 'Forest City Malaysia' },
            { thumb: imgSolo, href: 'https://pages.markrenzo.com/media/Snapinsta.app_video_An8EXcgMgp6yHFUfPvbVc3pZ-RVbgQFJQo0q7snBr8BXySAh8_zw4AtpdhPfq8l8FhZPqaTDJs8EttSKg7QD4x6R.mp4', text: 'Solo Travel' },
            { thumb: imgGaming, href: 'https://pages.markrenzo.com/media/Snapinsta.app_video_An9_3U3c5ITMd4RbbrAG3E9Y_QeaAInxsVie3WvOybRjFV952SFh71EhYiHycP1XUGjP4dJRQ1ZsbU1UUX32zMjf.mp4', text: 'Gaming Hotel' },
            { thumb: imgGrampians, href: 'https://pages.markrenzo.com/media/Snapinsta.app_video_D0459294601A98F928D3907BEC3CA9AC_video_dashinit.mp4', text: 'Grampians' },
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