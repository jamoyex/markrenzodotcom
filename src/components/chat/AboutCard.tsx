import ProfileCard from './ProfileCard';
import CircularGallery from './CircularGallery';
import avatarImg from '@/assets/images/markrenzosquare.png';
import grainImg from '@/assets/images/grain.webp';
// import imgForest from '@/assets/images/forestcitymalaysia.jpg';
import imgSolo from '@/assets/images/solotravel.jpg';
import imgGaming from '@/assets/images/gaminghotel.jpg';
import imgGrampians from '@/assets/images/grampians.jpg';
import imgStartupSipsV2 from '@/assets/images/startupsipsv2.png';
import imgStartupSipsV1 from '@/assets/images/startupsipsv1.png';
import imgGreatOceanRoad from '@/assets/images/greatoceanroad.png';
import imgFrontCover from '@/assets/images/frontcover.png';
import imgForestCityNew from '@/assets/images/forestcitynew.png';
import imgStartupSteps from '@/assets/images/startupsteps.png';
import { useMemo } from 'react';
import imgBusinessClass from '@/assets/images/businessclass.jpg';

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
          enableWheel={false}
          autoplay={true}
          autoplaySpeed={0.03}
          font={'normal 30px "Montserrat", system-ui, -apple-system, sans-serif'}
          items={useMemo(() => ([
            { thumb: imgGreatOceanRoad, href: 'https://media.hellomarky.com/Ig%20Reels/greatoceanroad.mp4', text: 'Scenice views at the Great Ocean Road 🌊' },
            { thumb: imgStartupSipsV2, href: 'https://media.hellomarky.com/Ig%20Reels/startupsipsv2.mp4', text: 'Another epic event at the Startup Sips 🍺' },
            { thumb: imgSolo, href: 'https://pages.markrenzo.com/media/Snapinsta.app_video_An8EXcgMgp6yHFUfPvbVc3pZ-RVbgQFJQo0q7snBr8BXySAh8_zw4AtpdhPfq8l8FhZPqaTDJs8EttSKg7QD4x6R.mp4', text: 'Making new friends across SE Asia 🌏' },
            { thumb: imgStartupSipsV1, href: 'https://media.hellomarky.com/Ig%20Reels/startupsipsv1.mp4', text: 'Having a great vibe at Startup Sips 🍻' },
            { thumb: imgStartupSteps, href: 'https://media.hellomarky.com/Ig%20Reels/startupsteps.mp4', text: 'Melbourne history at Startup Steps 📚' },
            { thumb: imgForestCityNew, href: 'https://media.hellomarky.com/Ig%20Reels/forescity.mp4', text: 'Appreciating the beauty of Forest City 🌳' },
            { thumb: imgFrontCover, href: 'https://media.hellomarky.com/Ig%20Reels/launchpartyfrontcover.mp4', text: 'Attending the launch party for Front Cover 🎉' },
            { thumb: imgGrampians, href: 'https://pages.markrenzo.com/media/Snapinsta.app_video_D0459294601A98F928D3907BEC3CA9AC_video_dashinit.mp4', text: 'Hiking scenic trails in the Grampians 🏞' },
            { thumb: imgGaming, href: 'https://pages.markrenzo.com/media/Snapinsta.app_video_An9_3U3c5ITMd4RbbrAG3E9Y_QeaAInxsVie3WvOybRjFV952SFh71EhYiHycP1XUGjP4dJRQ1ZsbU1UUX32zMjf.mp4', text: 'Enjoying all night gaming in Sem9 🎮' },
            { thumb: imgBusinessClass, href: 'https://media.hellomarky.com/Ig%20Reels/businessclass.mp4', text: 'Enjoying my hotel stay in the sky 🛫' },
          ]), [])}
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