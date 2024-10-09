import React, { useState, useEffect } from 'react';
import { BookOpen, User, Search, PlusCircle, LogOut, Heart, BookmarkPlus, Filter, Star, ChevronLeft, ChevronRight, InfoIcon } from 'lucide-react';
import { auth, db } from './firebase';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { collection, getDocs, addDoc, query, where, updateDoc, doc, deleteDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

export default function EnhancedBookApp() {
  const [currentPage, setCurrentPage] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [sortBy, setSortBy] = useState('relevance');
  const [activeTab, setActiveTab] = useState('recommendations');
  const [user, setUser] = useState(null);
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [currentBookIndex, setCurrentBookIndex] = useState(0);
  const [likedBooks, setLikedBooks] = useState([]);
  const [favoriteBooks, setFavoriteBooks] = useState([]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      if (user) {
        fetchUserData(user.uid);
      } else {
        setLikedBooks([]);
        setFavoriteBooks([]);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchBooks = async () => {
      const booksCollection = collection(db, 'books');
      const booksSnapshot = await getDocs(booksCollection);
      const booksList = booksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBooks(booksList);
    };

    fetchBooks();
  }, []);

  const fetchUserData = async (userId) => {
    const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', userId)));
    if (!userDoc.empty) {
      const userData = userDoc.docs[0].data();
      setLikedBooks(userData.likedBooks || []);
      setFavoriteBooks(userData.favoriteBooks || []);
    }
  };

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
      }, { merge: true });
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const addBook = async (book) => {
    try {
      const docRef = await addDoc(collection(db, 'books'), book);
      setBooks([...books, { id: docRef.id, ...book }]);
      return true;
    } catch (error) {
      console.error('Error adding book:', error);
      return false;
    }
  };

  const updateBook = async (bookId, updatedData) => {
    try {
      const bookRef = doc(db, 'books', bookId);
      await updateDoc(bookRef, updatedData);
      setBooks(books.map(book => book.id === bookId ? { ...book, ...updatedData } : book));
      return true;
    } catch (error) {
      console.error('Error updating book:', error);
      return false;
    }
  };

  const deleteBook = async (bookId) => {
    try {
      await deleteDoc(doc(db, 'books', bookId));
      setBooks(books.filter(book => book.id !== bookId));
      return true;
    } catch (error) {
      console.error('Error deleting book:', error);
      return false;
    }
  };

  const handleLikeBook = async (bookId) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    if (likedBooks.includes(bookId)) {
      await updateDoc(userRef, {
        likedBooks: arrayRemove(bookId)
      });
      setLikedBooks(likedBooks.filter(id => id !== bookId));
    } else {
      await updateDoc(userRef, {
        likedBooks: arrayUnion(bookId)
      });
      setLikedBooks([...likedBooks, bookId]);
    }
  };

  const handleFavoriteBook = async (bookId) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    if (favoriteBooks.includes(bookId)) {
      await updateDoc(userRef, {
        favoriteBooks: arrayRemove(bookId)
      });
      setFavoriteBooks(favoriteBooks.filter(id => id !== bookId));
    } else {
      await updateDoc(userRef, {
        favoriteBooks: arrayUnion(bookId)
      });
      setFavoriteBooks([...favoriteBooks, bookId]);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const results = books.filter(book => 
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setSearchResults(results);
    setCurrentPage('search');
  };

  const renderBookCard = (book) => (
    <div key={book.id} className="bg-white/10 backdrop-blur-lg rounded-lg p-4 text-white">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-lg">{book.title}</h3>
          <p className="text-gray-300">{book.author}</p>
          <span className="inline-block bg-white/20 rounded px-2 py-1 text-sm mt-2">
            {book.genre}
          </span>
        </div>
        <div className="flex space-x-2">
          <button 
            className={`p-2 hover:bg-white/20 rounded-full transition-colors ${likedBooks.includes(book.id) ? 'text-red-500' : ''}`}
            onClick={() => handleLikeBook(book.id)}
          >
            <Heart className="h-4 w-4" />
          </button>
          <button 
            className={`p-2 hover:bg-white/20 rounded-full transition-colors ${favoriteBooks.includes(book.id) ? 'text-yellow-500' : ''}`}
            onClick={() => handleFavoriteBook(book.id)}
          >
            <BookmarkPlus className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="mt-4 flex justify-between items-center">
        <div className="flex items-center">
          <span className="text-yellow-400">★</span>
          <span className="ml-1">{book.rating}</span>
        </div>
        <button 
          className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm transition-colors"
          onClick={() => setSelectedBook(book)}
        >
          Detaylar
        </button>
      </div>
    </div>
  );

  const HomePage = () => (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-bold text-white mb-4">Popüler Öneriler</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {books.slice(0, 3).map(renderBookCard)}
        </div>
      </section>
      
      <section>
        <h2 className="text-2xl font-bold text-white mb-4">Size Özel Öneriler</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {books.slice(3, 6).map(renderBookCard)}
        </div>
      </section>
    </div>
  );

  const AboutPage = () => (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-bold text-white mb-4">Hakkımızda</h2>
        <p className="text-gray-300">
          Kuuburi, Adını Japonca bir ses oyunundan alan deneysel kitap öneri platformudur.
          </p>
          <p className="text-gray-300">
          Hızlıca profiller oluşturup kitap önerileri alabilir, kitaplar hakkında yorumlar yapabilirsiniz.
</p>
          <p className="text-gray-300">
          Kuuburi, kitap okuma alışkanlıklarınızı analiz ederek size en uygun kitapları önerir.
          </p>
          <hr />
         
       
      </section>
      
      <section>
    
        <p className="text-gray-300">
          
        <code>
            Egehan KAHRAMAN tarafından ❤️ ile geliştirilmiştir.
          </code> 
        </p>
      </section>

    </div>
  );

  const SearchResults = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Arama Sonuçları</h2>
        <div className="flex space-x-2">
          <select 
            className="bg-white/20 border-none text-white rounded px-3 py-2 appearance-none"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="relevance">İlgililik</option>
            <option value="rating">Puan</option>
            <option value="newest">En Yeni</option>
          </select>
          <button className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            Filtrele
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {searchResults.map(renderBookCard)}
      </div>
    </div>
  );

  const UserProfile = () => {
    const [userRecommendations, setUserRecommendations] = useState([]);
  
    useEffect(() => {
      if (user) {
        fetchUserRecommendations();
      }
    }, [user]);
  
    const fetchUserRecommendations = async () => {
      const recommendationsQuery = query(collection(db, 'books'), where('recommendedBy', '==', user.uid));
      const recommendationsSnapshot = await getDocs(recommendationsQuery);
      const recommendationsList = recommendationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUserRecommendations(recommendationsList);
    };
  
    const likedBooksList = books.filter(book => likedBooks.includes(book.id));
    const favoriteBooksList = books.filter(book => favoriteBooks.includes(book.id));
  
    return (
      <div className="space-y-6">
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-white">
          <div className="flex items-center space-x-4">
            <div className="h-20 w-20 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
              {user ? user.displayName.charAt(0) : 'G'}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{user ? user.displayName : 'Misafir'}</h2>
              <p className="text-gray-300">{user ? `${user.score}` : 'Lütfen giriş yapın'}</p>
            </div>
          </div>
        </div>
   
  <div className="space-y-4">
    <div className="flex bg-white/20 rounded-lg p-1">
      {['recommendations', 'reading-list', 'favorites'].map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`flex-1 py-2 rounded ${
            activeTab === tab ? 'bg-white/20' : ''
          } transition-colors`}
        >
          {tab === 'recommendations' && 'Önerilerim'}
          {tab === 'reading-list' && 'Beğendiğim Kitaplar'}
          {tab === 'favorites' && 'Favorilerim'}
        </button>
      ))}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {activeTab === 'recommendations' && userRecommendations.map(renderBookCard)}
      {activeTab === 'reading-list' && likedBooksList.map(renderBookCard)}
      {activeTab === 'favorites' && favoriteBooksList.map(renderBookCard)}
    </div>
    </div>
    
      
      </div>
    );
  };

  const AddRecommendation = () => {
    const [newBook, setNewBook] = useState({
      title: '',
      author: '',
      genre: '',
      rating: 0,
      description: '',
    });
    const [message, setMessage] = useState('');

    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setNewBook({ ...newBook, [name]: value });
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (newBook.title && newBook.author && newBook.genre && newBook.rating && newBook.description) {
        const bookWithUser = { ...newBook, recommendedBy: user.uid };
        const success = await addBook(bookWithUser);
        if (success) {
          setMessage('Kitap önerisi başarıyla eklendi!');
          setNewBook({ title: '', author: '', genre: '', rating: 0, description: '' });
        } else {
          setMessage('Kitap önerisi eklenirken bir hata oluştu. Lütfen tekrar deneyin.');
        }
      } else {
        setMessage('Lütfen tüm alanları doldurun.');
      }
    };

    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-4">Yeni Kitap Önerisi Ekle</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1">Kitap Adı</label>
            <input
              type="text"
              name="title"
              value={newBook.title}
              onChange={handleInputChange}
              className="w-full bg-white/20 rounded px-3 py-2 text-white"
              required
            />
          </div>
          <div>
            <label className="block mb-1">Yazar</label>
            <input
              type="text"
              name="author"
              value={newBook.author}
              onChange={handleInputChange}
              className="w-full bg-white/20 rounded px-3 py-2 text-white"
              required
            />
          </div>
          <div>
            <label className="block mb-1">Tür</label>
            <input
              type="text"
              name="genre"
              value={newBook.genre}
              onChange={handleInputChange}
              className="w-full bg-white/20 rounded px-3 py-2 text-white"
              required
            />
          </div>
          <div>
            <label className="block mb-1">Puan (1-5)</label>
            <input
              type="number"
              name="rating"
              value={newBook.rating}
              onChange={handleInputChange}
              min="1"
              max="5"
              step="0.1"
              className="w-full bg-white/20 rounded px-3 py-2 text-white"
              required
            />
          </div>
          <div>
            <label className="block mb-1">Açıklama</label>
            <textarea
              name="description"
              value={newBook.description}
              onChange={handleInputChange}
              className="w-full bg-white/20 rounded px-3 py-2 text-white"
              rows="4"
              required
            ></textarea>
          </div>
          <button type="submit" className="w-full bg-white/20 hover:bg-white/30 rounded px-4 py-2 transition-colors">
            Öneri Ekle
          </button>
        </form>
        {message && <p className="mt-4 text-center">{message}</p>}
      </div>
    );
  };

  const BookDetails = ({ book, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-white max-w-2xl w-full">
        <h2 className="text-2xl font-bold mb-4">{book.title}</h2>
        <p className="text-gray-300 mb-2">{book.author}</p>
        <div className="flex items-center mb-4">
          <span className="text-yellow-400 mr-1">★</span>
          <span>{book.rating}</span>
          <span className="ml-2 bg-white/20 rounded px-2 py-1 text-sm">{book.genre}</span>
        </div>
        <p className="mb-4">{book.description}</p>
        <div className="flex justify-between">
          <button onClick={onClose} className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded transition-colors">
            Kapat
          </button>
          {user && (
            <div className="flex space-x-2">
              <button className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded transition-colors" disabled>
                Düzenle
              </button>
              <button 
                className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded transition-colors"
                onClick={() => {
                  deleteBook(book.id);
                  onClose();
                }}
              disabled>
                Sil
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'about':
        return <AboutPage />;
      case 'search':
        return <SearchResults />;
      case 'profile':
        return <UserProfile />;
      case 'add':
        return <AddRecommendation />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 p-4">
      <div className="max-w-6xl mx-auto">
        <nav className="flex justify-between items-center mb-8 bg-white/10 backdrop-blur-lg p-4 rounded-lg">
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage('home')}
              className={`px-4 py-2 rounded flex items-center ${
                currentPage === 'home' ? 'bg-white/20' : 'hover:bg-white/10'
              } transition-colors text-white`}
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Kuuburi
            </button>
            {['home', 'about','search', 'add'].map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-4 py-2 rounded flex items-center ${
                  currentPage === page ? 'bg-white/20' : 'hover:bg-white/10'
                } transition-colors text-white`}
              >
                {page === 'home' && <BookOpen className="mr-2 h-4 w-4" />}
                {page === 'about' && <InfoIcon className="mr-2 h-4 w-4" />}
                {page === 'search' && <Search className="mr-2 h-4 w-4" />}
                {page === 'add' && <PlusCircle className="mr-2 h-4 w-4" />}
                {page === 'home' && 'Ana Sayfa'}
                {page === 'about' && 'Hakkımızda'}
                {page === 'search' && 'Kitap Ara'}
                {page === 'add' && 'Öneri Ekle'}
              </button>
            ))}
          </div>
          <div className="flex space-x-2">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Kitap veya yazar ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/20 rounded px-3 py-2 pr-10 text-white placeholder-white/70"
              />
              <button type="submit" className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <Search className="h-4 w-4 text-white" />
              </button>
            </form>
            {user ? (
              <>
                <button
                  onClick={() => setCurrentPage('profile')}
                  className={`px-4 py-2 rounded flex items-center ${
                    currentPage === 'profile' ? 'bg-white/20' : 'hover:bg-white/10'
                  } transition-colors text-white`}
                >
                  <User className="mr-2 h-4 w-4" />
                  Profil
                </button>
                <button onClick={handleSignOut} className="px-4 py-2 rounded flex items-center hover:bg-white/10 transition-colors text-white">
                  <LogOut className="mr-2 h-4 w-4" />
                  Çıkış
                </button>
              </>
            ) : (
              <button onClick={handleSignIn} className="px-4 py-2 rounded flex items-center hover:bg-white/10 transition-colors text-white">
                <User className="mr-2 h-4 w-4" />
                Giriş Yap
              </button>
            )}
          </div>
        </nav>

        {renderContent()}

        {selectedBook && (
          <BookDetails book={selectedBook} onClose={() => setSelectedBook(null)} />
        )}
      </div>
    </div>
  );
}