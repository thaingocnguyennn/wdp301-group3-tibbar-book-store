import { useState, useEffect } from "react";
import { sliderApi } from "../../api/sliderApi";

/**
 * SliderCarousel Component
 * Hiển thị slider carousel trên homepage
 */
const SliderCarousel = () => {
  const [sliders, setSliders] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSliders();
  }, []);

  // Auto slide every 5 seconds
  useEffect(() => {
    if (sliders.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % sliders.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [sliders.length]);

  const fetchSliders = async () => {
    try {
      const response = await sliderApi.getVisibleSliders();
      setSliders(response.data.sliders || []);
    } catch (error) {
      console.error("Failed to fetch sliders:", error);
    } finally {
      setLoading(false);
    }
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? sliders.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % sliders.length);
  };

  if (loading) {
    return <div style={styles.loading}>Loading sliders...</div>;
  }

  if (sliders.length === 0) {
    return null;
  }

  const currentSlider = sliders[currentIndex];

  return (
    <div style={styles.carousel}>
      <div style={styles.sliderContainer}>
        {/* Main Slider Image */}
        <div style={styles.slide}>
          <img src={currentSlider.imageUrl} alt="Slider" style={styles.image} />
          <div style={styles.overlay}>
            <div style={styles.content}>
              {currentSlider.description && (
                <p style={styles.description}>{currentSlider.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        {sliders.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              style={{ ...styles.arrow, ...styles.arrowLeft }}
            >
              ❮
            </button>
            <button
              onClick={goToNext}
              style={{ ...styles.arrow, ...styles.arrowRight }}
            >
              ❯
            </button>
          </>
        )}

        {/* Dots Indicator */}
        {sliders.length > 1 && (
          <div style={styles.dots}>
            {sliders.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                style={{
                  ...styles.dot,
                  ...(index === currentIndex ? styles.dotActive : {}),
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  carousel: {
    width: "100%",
    marginBottom: "2rem",
  },
  loading: {
    textAlign: "center",
    padding: "2rem",
    color: "#666",
  },
  sliderContainer: {
    position: "relative",
    width: "100%",
    height: "400px",
    overflow: "hidden",
    borderRadius: "8px",
  },
  slide: {
    position: "relative",
    width: "100%",
    height: "100%",
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background:
      "linear-gradient(to right, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 100%)",
    display: "flex",
    alignItems: "center",
    padding: "0 4rem",
  },
  content: {
    maxWidth: "600px",
    color: "#fff",
  },
  description: {
    fontSize: "1.2rem",
    marginBottom: "1.5rem",
    textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
  },
  button: {
    display: "inline-block",
    padding: "0.75rem 2rem",
    backgroundColor: "#3498db",
    color: "#fff",
    textDecoration: "none",
    borderRadius: "4px",
    fontSize: "1rem",
    fontWeight: "bold",
    transition: "background-color 0.3s",
  },
  arrow: {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    backgroundColor: "rgba(255,255,255,0.3)",
    color: "#fff",
    border: "none",
    fontSize: "2rem",
    padding: "0.5rem 1rem",
    cursor: "pointer",
    transition: "background-color 0.3s",
    zIndex: 10,
  },
  arrowLeft: {
    left: "1rem",
  },
  arrowRight: {
    right: "1rem",
  },
  dots: {
    position: "absolute",
    bottom: "1rem",
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    gap: "0.5rem",
    zIndex: 10,
  },
  dot: {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    border: "2px solid #fff",
    backgroundColor: "transparent",
    cursor: "pointer",
    transition: "background-color 0.3s",
  },
  dotActive: {
    backgroundColor: "#fff",
  },
};

export default SliderCarousel;
