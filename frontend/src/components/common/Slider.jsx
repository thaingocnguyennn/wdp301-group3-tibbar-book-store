import { useState, useEffect } from "react";

const Slider = ({ images = [] }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Default promotional images/slides if none provided
  const defaultSlides = [
    {
      id: 1,
      title: "Welcome to Tibbar Bookstore",
      subtitle: "Explore thousands of amazing books",
      color: "#667eea",
      icon: "📚",
    },
    {
      id: 2,
      title: "Discover Newest Books",
      subtitle: "Fresh arrivals every week",
      color: "#764ba2",
      icon: "✨",
    },
    {
      id: 3,
      title: "Great Deals & Discounts",
      subtitle: "Find your next favorite read at amazing prices",
      color: "#f093fb",
      icon: "🎉",
    },
    {
      id: 4,
      title: "Join Our Community",
      subtitle: "Connect with book lovers worldwide",
      color: "#4facfe",
      icon: "🌐",
    },
  ];

  const slides = images.length > 0 ? images : defaultSlides;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(timer);
  }, [slides.length]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  if (!slides || slides.length === 0) return null;

  return (
    <div style={styles.sliderContainer}>
      {/* Slides */}
      <div style={styles.slidesWrapper}>
        {slides.map((s, index) => (
          <div
            key={s.id || index}
            style={{
              ...styles.slide,
              background: s.backgroundImage
                ? `url(${s.backgroundImage}) center/cover`
                : `linear-gradient(135deg, ${s.color} 0%, ${adjustBrightness(s.color, -20)} 100%)`,
              opacity: index === currentSlide ? 1 : 0,
              pointerEvents: index === currentSlide ? "auto" : "none",
            }}
          />
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        style={styles.prevButton}
        aria-label="Previous slide"
      >
        ❮
      </button>
      <button
        onClick={goToNext}
        style={styles.nextButton}
        aria-label="Next slide"
      >
        ❯
      </button>

      {/* Dots Navigation */}
      <div style={styles.dotsContainer}>
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            style={{
              ...styles.dot,
              ...(index === currentSlide && styles.activeDot),
            }}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Slide Counter */}
      <div style={styles.slideCounter}>
        {currentSlide + 1} / {slides.length}
      </div>
    </div>
  );
};

// Helper function to adjust color brightness
const adjustBrightness = (color, percent) => {
  const num = parseInt(color.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, (num >> 16) + amt);
  const G = Math.max(0, ((num >> 8) & 0x00ff) + amt);
  const B = Math.max(0, (num & 0x0000ff) + amt);
  return (
    "#" +
    (
      0x1000000 +
      (R < 255 ? R : 255) * 0x10000 +
      (G < 255 ? G : 255) * 0x100 +
      (B < 255 ? B : 255)
    )
      .toString(16)
      .slice(1)
  );
};

const styles = {
  sliderContainer: {
    position: "relative",
    width: "100%",
    height: "400px",
    overflow: "hidden",
    borderRadius: "16px",
    boxShadow: "0 10px 40px rgba(102, 126, 234, 0.25)",
    marginBottom: "3rem",
  },
  slidesWrapper: {
    position: "relative",
    width: "100%",
    height: "100%",
  },
  slide: {
    position: "absolute",
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "opacity 0.8s ease-in-out",
    top: 0,
    left: 0,
  },
  prevButton: {
    position: "absolute",
    left: "20px",
    top: "50%",
    transform: "translateY(-50%)",
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    color: "#fff",
    border: "none",
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    fontSize: "1.5rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s ease",
    zIndex: 10,
    backdropFilter: "blur(10px)",
  },
  nextButton: {
    position: "absolute",
    right: "20px",
    top: "50%",
    transform: "translateY(-50%)",
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    color: "#fff",
    border: "none",
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    fontSize: "1.5rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s ease",
    zIndex: 10,
    backdropFilter: "blur(10px)",
  },
  dotsContainer: {
    position: "absolute",
    bottom: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    gap: "10px",
    zIndex: 10,
  },
  dot: {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    border: "none",
    cursor: "pointer",
    transition: "all 0.3s ease",
    backdropFilter: "blur(10px)",
  },
  activeDot: {
    backgroundColor: "#fff",
    width: "28px",
    borderRadius: "6px",
  },
  slideCounter: {
    position: "absolute",
    top: "20px",
    right: "20px",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    color: "#fff",
    padding: "0.5rem 1rem",
    borderRadius: "20px",
    fontSize: "0.9rem",
    fontWeight: "600",
    backdropFilter: "blur(10px)",
    zIndex: 10,
  },
};

export default Slider;
