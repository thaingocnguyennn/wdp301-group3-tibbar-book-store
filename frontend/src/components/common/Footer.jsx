const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer style={styles.footer}>
            <div style={styles.container}>
                <div style={styles.content}>
                    {/* About Section */}
                    <div style={styles.section}>
                        <h3 style={styles.sectionTitle}>📚 About Tibbar</h3>
                        <p style={styles.text}>
                            Your ultimate destination for discovering and exploring the world of books.
                            We connect book lovers with their next favorite read.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div style={styles.section}>
                        <h3 style={styles.sectionTitle}>🔗 Quick Links</h3>
                        <ul style={styles.list}>
                            <li><a href="/" style={styles.link}>Home</a></li>
                            <li><a href="/newest" style={styles.link}>Newest Books</a></li>
                            <li><a href="/login" style={styles.link}>Login</a></li>
                            <li><a href="/register" style={styles.link}>Register</a></li>
                        </ul>
                    </div>

                    {/* Contact Section */}
                    <div style={styles.section}>
                        <h3 style={styles.sectionTitle}>📞 Contact Us</h3>
                        <p style={styles.text}>
                            📧 Email: <a href="mailto:info@tibbar.com" style={styles.link}>info@tibbar.com</a>
                        </p>
                        <p style={styles.text}>
                            📱 Phone: <a href="tel:+1234567890" style={styles.link}>+1 (234) 567-890</a>
                        </p>
                    </div>

                    {/* Follow Us */}
                    <div style={styles.section}>
                        <h3 style={styles.sectionTitle}>🌐 Follow Us</h3>
                        <div style={styles.socialLinks}>
                            <a href="#" style={styles.socialIcon}>Facebook</a>
                            <a href="#" style={styles.socialIcon}>Twitter</a>
                            <a href="#" style={styles.socialIcon}>Instagram</a>
                            <a href="#" style={styles.socialIcon}>LinkedIn</a>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div style={styles.divider}></div>

                {/* Bottom Section */}
                <div style={styles.bottom}>
                    <p style={styles.copyright}>
                        © {currentYear} Tibbar Bookstore. All rights reserved.
                    </p>
                    <div style={styles.bottomLinks}>
                        <a href="#" style={styles.footerLink}>Privacy Policy</a>
                        <span style={styles.separator}>•</span>
                        <a href="#" style={styles.footerLink}>Terms of Service</a>
                        <span style={styles.separator}>•</span>
                        <a href="#" style={styles.footerLink}>Cookie Policy</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

const styles = {
    footer: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#fff',
        padding: '3rem 2rem 1rem',
        marginTop: '4rem',
        boxShadow: '0 -4px 15px rgba(102, 126, 234, 0.2)'
    },
    container: {
        maxWidth: '1200px',
        margin: '0 auto'
    },
    content: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '2rem',
        marginBottom: '2rem'
    },
    section: {
        display: 'flex',
        flexDirection: 'column'
    },
    sectionTitle: {
        fontSize: '1.1rem',
        fontWeight: '700',
        marginBottom: '1rem',
        color: '#fff',
        borderBottom: '2px solid rgba(255, 255, 255, 0.3)',
        paddingBottom: '0.5rem'
    },
    text: {
        fontSize: '0.95rem',
        lineHeight: '1.6',
        color: 'rgba(255, 255, 255, 0.9)',
        margin: '0.5rem 0'
    },
    list: {
        listStyle: 'none',
        padding: 0,
        margin: 0
    },
    link: {
        color: 'rgba(255, 255, 255, 0.9)',
        textDecoration: 'none',
        transition: 'all 0.3s ease',
        borderBottom: '1px solid transparent'
    },
    socialLinks: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
    },
    socialIcon: {
        display: 'inline-block',
        color: 'rgba(255, 255, 255, 0.9)',
        textDecoration: 'none',
        padding: '0.5rem 0',
        transition: 'all 0.3s ease',
        fontSize: '0.95rem'
    },
    divider: {
        height: '1px',
        background: 'rgba(255, 255, 255, 0.2)',
        margin: '1.5rem 0'
    },
    bottom: {
        textAlign: 'center',
        paddingTop: '1rem'
    },
    copyright: {
        fontSize: '0.9rem',
        color: 'rgba(255, 255, 255, 0.8)',
        margin: '0 0 0.75rem 0'
    },
    bottomLinks: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '0.75rem',
        flexWrap: 'wrap'
    },
    footerLink: {
        color: 'rgba(255, 255, 255, 0.8)',
        textDecoration: 'none',
        fontSize: '0.85rem',
        transition: 'all 0.3s ease'
    },
    separator: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: '0.85rem'
    }
};

export default Footer;
