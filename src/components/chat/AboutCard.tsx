export default function AboutCard() {
  return (
    <div className="component-wrapper">
      <div className="component-header">
        Personal Profile
      </div>
      <div className="component-content">
        <div className="about-component">
          <img 
            src="https://images.unsplash.com/photo-1560250097-0b93528c311a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400" 
            alt="A professional headshot" 
            className="profile-image"
          />
          <div className="bio">
            <h3>Mark Renzo</h3>
            <p>I'm a creative technologist specializing in AI-powered automation. My mission is to design and build intelligent systems that are not only efficient and scalable but also intuitive and beautiful to use. I thrive at the intersection of code, data, and design.</p>
          </div>
        </div>
      </div>
    </div>
  );
} 