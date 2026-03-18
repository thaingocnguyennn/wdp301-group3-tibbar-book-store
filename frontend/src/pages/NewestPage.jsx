import { useState, useEffect } from 'react';
import { bookApi } from '../api/bookApi';
import BookCard from '../components/books/BookCard';

const NewestPage = () => {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNewestBooks();
    }, []);

    const fetchNewestBooks = async () => {
        try {
            setLoading(true);
            const response = await bookApi.getNewestBooks(4);
            setBooks(response.data.books);
        } catch (error) {
            console.error('Error fetching newest books:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            {/* Banner Section */}
            <section style={styles.banner}>
                <div style={styles.bannerContent}>
                    <h1 style={styles.bannerTitle}>✨ Newest Arrivals</h1>
                    <p style={styles.bannerSubtitle}>Check Out Our Latest Book Collections</p>
                </div>
            </section>

            {/* Newest Books Section */}
            <section style={styles.section}>
                <div style={styles.sectionHeader}>
                    <h2 style={styles.sectionTitle}>🎉 Latest Books</h2>
                    <div style={styles.titleUnderline}></div>
                </div>

                {loading ? (
                    <div style={styles.loading}>
                        <div style={styles.spinner}></div>
                        <p>Loading newest books...</p>
                    </div>
                ) : books.length === 0 ? (
                    <div style={styles.empty}>
                        <p>😔 No books found</p>
                    </div>
                ) : (
                    <div style={styles.grid}>
                        {books.map((book) => (
                            <BookCard key={book._id} book={book} />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

const styles = {
    container: {
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        minHeight: '100vh'
    },
    banner: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#fff',
        padding: '4rem 2rem',
        marginBottom: '3rem',
        boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
        borderRadius: '0 0 20px 20px'
    },
    bannerContent: {
        maxWidth: '1200px',
        margin: '0 auto',
        textAlign: 'center'
    },
    bannerTitle: {
        fontSize: '3rem',
        fontWeight: '700',
        marginBottom: '0.5rem',
        textShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    bannerSubtitle: {
        fontSize: '1.3rem',
        fontWeight: '300',
        opacity: '0.95'
    },
    section: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 2rem',
        marginBottom: '3rem'
    },
    sectionHeader: {
        marginBottom: '2rem'
    },
    sectionTitle: {
        fontSize: '2rem',
        color: '#2c3e50',
        marginBottom: '0.75rem',
        fontWeight: '700'
    },
    titleUnderline: {
        width: '60px',
        height: '4px',
        background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '2px'
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '2rem'
    },
    loading: {
        textAlign: 'center',
        padding: '3rem 2rem',
        fontSize: '1.2rem',
        color: '#667eea'
    },
    spinner: {
        width: '50px',
        height: '50px',
        border: '4px solid #e0e0e0',
        borderTop: '4px solid #667eea',
        borderRadius: '50%',
        margin: '0 auto 1rem',
        animation: 'spin 1s linear infinite'
    },
    empty: {
        textAlign: 'center',
        padding: '3rem 2rem',
        backgroundColor: '#fff',
        borderRadius: '12px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
        color: '#7f8c8d'
    }
};

export default NewestPage;
