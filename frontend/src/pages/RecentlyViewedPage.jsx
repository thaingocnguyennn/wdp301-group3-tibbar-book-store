import { useEffect, useState } from "react";
import axios from "../api/axios";
import BookCard from "../components/books/BookCard";

const RecentlyViewedPage = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentlyViewed = async () => {
      try {
        const res = await axios.get("/users/me/recently-viewed");
        setBooks(res.data.data.books);
      } catch (error) {
        console.error("Failed to fetch recently viewed", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentlyViewed();
  }, []);

  if (loading)
    return <div className="container mt-4">Loading...</div>;

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Recently Viewed Books</h2>

      {books.length === 0 ? (
        <p>You haven't viewed any books yet.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "20px",
          }}
        >
          {books.map((book) => (
            <BookCard key={book._id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentlyViewedPage;