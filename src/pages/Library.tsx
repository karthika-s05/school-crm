import { useEffect, useState } from 'react';
import { Search, Plus, X, Library as LibraryIcon, BookOpen } from 'lucide-react';
import { supabase, type LibraryBook, type LibraryIssue, type Student } from '../lib/supabase';
import { Badge, LoadingSpinner, EmptyState, SectionCard } from '../components/ui';

export default function Library() {
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [issues, setIssues] = useState<LibraryIssue[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'books' | 'issues'>('books');
  const [search, setSearch] = useState('');
  const [showBookModal, setShowBookModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [bookForm, setBookForm] = useState({ title: '', author: '', isbn: '', category: 'General', total_copies: '1', published_year: '' });
  const [issueForm, setIssueForm] = useState({ book_id: '', student_id: '', due_date: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [bRes, iRes, sRes] = await Promise.all([
      supabase.from('library_books').select('*').order('title'),
      supabase.from('library_issues').select('*, library_books(title), students(name)').order('issue_date', { ascending: false }),
      supabase.from('students').select('id, name').order('name'),
    ]);
    setBooks((bRes.data || []) as LibraryBook[]);
    setIssues((iRes.data || []) as unknown as LibraryIssue[]);
    setStudents((sRes.data || []) as Student[]);
    setLoading(false);
  }

  async function handleAddBook() {
    if (!bookForm.title.trim()) return;
    setSaving(true);
    const copies = parseInt(bookForm.total_copies) || 1;
    await supabase.from('library_books').insert({
      title: bookForm.title, author: bookForm.author, isbn: bookForm.isbn,
      category: bookForm.category, total_copies: copies, available_copies: copies,
      published_year: bookForm.published_year ? parseInt(bookForm.published_year) : null,
    });
    setSaving(false);
    setShowBookModal(false);
    fetchAll();
  }

  async function handleIssueBook() {
    if (!issueForm.book_id || !issueForm.student_id || !issueForm.due_date) return;
    setSaving(true);
    await supabase.from('library_issues').insert({
      book_id: issueForm.book_id, student_id: issueForm.student_id,
      issue_date: new Date().toISOString().split('T')[0],
      due_date: issueForm.due_date, status: 'issued',
    });
    await supabase.from('library_books').rpc || await supabase.from('library_books').select('available_copies').eq('id', issueForm.book_id).single().then(async ({ data }) => {
      if (data && data.available_copies > 0) {
        await supabase.from('library_books').update({ available_copies: data.available_copies - 1 }).eq('id', issueForm.book_id);
      }
    });
    setSaving(false);
    setShowIssueModal(false);
    fetchAll();
  }

  async function handleReturn(issue: LibraryIssue) {
    await supabase.from('library_issues').update({ return_date: new Date().toISOString().split('T')[0], status: 'returned' }).eq('id', issue.id);
    const { data } = await supabase.from('library_books').select('available_copies').eq('id', issue.book_id).single();
    if (data) {
      await supabase.from('library_books').update({ available_copies: (data as any).available_copies + 1 }).eq('id', issue.book_id);
    }
    fetchAll();
  }

  const filteredBooks = books.filter(b => b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden">
          {(['books', 'issues'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium transition-colors capitalize ${tab === t ? 'bg-sky-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>{t}</button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setIssueForm({ book_id: '', student_id: '', due_date: '' }); setShowIssueModal(true); }} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <BookOpen size={16} /> Issue Book
          </button>
          <button onClick={() => { setBookForm({ title: '', author: '', isbn: '', category: 'General', total_copies: '1', published_year: '' }); setShowBookModal(true); }} className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} /> Add Book
          </button>
        </div>
      </div>

      {tab === 'books' && (
        <>
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 max-w-sm">
            <Search size={16} className="text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search books..." className="outline-none text-sm text-gray-700 flex-1" />
          </div>
          {loading ? <LoadingSpinner /> : filteredBooks.length === 0 ? <EmptyState message="No books found" icon={LibraryIcon} /> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredBooks.map(b => (
                <div key={b.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
                  <div className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center ${b.available_copies > 0 ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                    <BookOpen size={18} className={b.available_copies > 0 ? 'text-emerald-600' : 'text-rose-500'} />
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">{b.title}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{b.author}</p>
                  <p className="text-xs text-sky-600 mt-1">{b.category}</p>
                  <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                    <span className="text-xs text-gray-400">{b.total_copies} total</span>
                    <Badge variant={b.available_copies > 0 ? 'success' : 'danger'}>{b.available_copies} available</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'issues' && (
        <SectionCard title="Issued Books">
          {loading ? <LoadingSpinner /> : issues.length === 0 ? <EmptyState message="No books currently issued" icon={BookOpen} /> : (
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Book', 'Student', 'Issue Date', 'Due Date', 'Status', ''].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {issues.map((issue, i) => {
                    const overdue = issue.status === 'issued' && issue.due_date < new Date().toISOString().split('T')[0];
                    return (
                      <tr key={issue.id} className={`border-b border-gray-50 hover:bg-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                        <td className="px-5 py-3 font-medium text-gray-800 max-w-[180px] truncate">{(issue as any).library_books?.title}</td>
                        <td className="px-5 py-3 text-gray-600">{(issue as any).students?.name}</td>
                        <td className="px-5 py-3 text-gray-500 text-xs">{issue.issue_date}</td>
                        <td className="px-5 py-3 text-xs"><span className={overdue ? 'text-rose-500 font-medium' : 'text-gray-500'}>{issue.due_date}</span></td>
                        <td className="px-5 py-3">
                          <Badge variant={issue.status === 'returned' ? 'success' : overdue ? 'danger' : 'info'}>
                            {issue.status === 'returned' ? 'Returned' : overdue ? 'Overdue' : 'Issued'}
                          </Badge>
                        </td>
                        <td className="px-5 py-3">
                          {issue.status === 'issued' && (
                            <button onClick={() => handleReturn(issue)} className="text-xs text-sky-600 hover:text-sky-700 font-medium">Return</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      )}

      {/* Add Book Modal */}
      {showBookModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-900">Add New Book</h3>
              <button onClick={() => setShowBookModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-3">
              {[
                { label: 'Title *', key: 'title', placeholder: 'Book title' },
                { label: 'Author', key: 'author', placeholder: 'Author name' },
                { label: 'ISBN', key: 'isbn', placeholder: '978-...' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-medium text-gray-600 block mb-1">{f.label}</label>
                  <input value={(bookForm as any)[f.key]} onChange={e => setBookForm({...bookForm, [f.key]: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200" placeholder={f.placeholder} />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Category</label>
                  <select value={bookForm.category} onChange={e => setBookForm({...bookForm, category: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200">
                    {['Fiction', 'Textbook', 'Science', 'History', 'Technology', 'General'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Copies</label>
                  <input type="number" value={bookForm.total_copies} onChange={e => setBookForm({...bookForm, total_copies: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowBookModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
              <button onClick={handleAddBook} disabled={saving} className="px-5 py-2 text-sm bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-colors disabled:opacity-60 font-medium">
                {saving ? 'Saving...' : 'Add Book'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Issue Book Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-900">Issue Book</h3>
              <button onClick={() => setShowIssueModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Book *</label>
                <select value={issueForm.book_id} onChange={e => setIssueForm({...issueForm, book_id: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200">
                  <option value="">Select book</option>
                  {books.filter(b => b.available_copies > 0).map(b => <option key={b.id} value={b.id}>{b.title} ({b.available_copies} available)</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Student *</label>
                <select value={issueForm.student_id} onChange={e => setIssueForm({...issueForm, student_id: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200">
                  <option value="">Select student</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Due Date *</label>
                <input type="date" value={issueForm.due_date} onChange={e => setIssueForm({...issueForm, due_date: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200" />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowIssueModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
              <button onClick={handleIssueBook} disabled={saving} className="px-5 py-2 text-sm bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors disabled:opacity-60 font-medium">
                {saving ? 'Saving...' : 'Issue Book'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
