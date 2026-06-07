import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function BeatUpload() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  async function uploadImage(e) {
    e.preventDefault();
    if (!file) return alert('Select an image');

    setLoading(true);
    const fileName = `${Date.now()}-${file.name}`;
    
    const { data, error } = await supabase.storage
      .from('beat-images')
      .upload(fileName, file);

    if (error) {
      alert('Upload failed: ' + error.message);
    } else {
      alert('Image uploaded! Path: ' + data.path);
    }
    setLoading(false);
  }

  return (
    <form onSubmit={uploadImage} style={{ padding: '2rem', border: '1px solid #ddd' }}>
      <h3>Upload Beat Image</h3>
      <input 
        type="file" 
        accept="image/*"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Uploading...' : 'Upload'}
      </button>
    </form>
  );
}