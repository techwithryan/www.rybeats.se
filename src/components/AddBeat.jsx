import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function AddBeat({ onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    bpm: '',
    key: '',
    price: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!imageFile || !audioFile || !formData.name || !formData.bpm || !formData.key || !formData.price) {
      alert('Fill all fields and select both image and audio');
      return;
    }

    setLoading(true);

    // Upload image
    const imageName = `${Date.now()}-${imageFile.name}`;
    const { data: imageData, error: imageError } = await supabase.storage
      .from('beat-images')
      .upload(imageName, imageFile);

    if (imageError) {
      alert('Image upload failed: ' + imageError.message);
      setLoading(false);
      return;
    }

    // Upload audio
    const audioName = `${Date.now()}-${audioFile.name}`;
    const { data: audioData, error: audioError } = await supabase.storage
      .from('beat-files')
      .upload(audioName, audioFile);

    if (audioError) {
      alert('Audio upload failed: ' + audioError.message);
      setLoading(false);
      return;
    }

    // Get public URLs
    const { data: imageUrlData } = supabase.storage
      .from('beat-images')
      .getPublicUrl(imageData.path);

    const { data: audioUrlData } = supabase.storage
      .from('beat-files')
      .getPublicUrl(audioData.path);

    // Insert beat to database
    const { error: dbError } = await supabase
      .from('beats')
      .insert({
        name: formData.name,
        bpm: parseInt(formData.bpm),
        key: formData.key,
        price: parseInt(formData.price),
        image_url: imageUrlData.publicUrl,
        file_url: audioUrlData.publicUrl
      });

    if (dbError) {
      alert('Database error: ' + dbError.message);
    } else {
      setFormData({ name: '', bpm: '', key: '', price: '' });
      setImageFile(null);
      setAudioFile(null);
      const imageInput = document.getElementById('beat-image-input');
      const audioInput = document.getElementById('beat-audio-input');
      if (imageInput) imageInput.value = '';
      if (audioInput) audioInput.value = '';
      onSuccess?.();
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} style={{ padding: '2rem', border: '1px solid #ddd', maxWidth: '500px', margin: '2rem auto' }}>
      <h3>Add New Beat</h3>
      
      <input 
        type="text" 
        placeholder="Beat name"
        value={formData.name}
        onChange={(e) => setFormData({...formData, name: e.target.value})}
        style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem', boxSizing: 'border-box' }}
      />
      
      <input 
        type="number" 
        placeholder="BPM"
        value={formData.bpm}
        onChange={(e) => setFormData({...formData, bpm: e.target.value})}
        style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem', boxSizing: 'border-box' }}
      />
      
      <input 
        type="text" 
        placeholder="Key (e.g. Am)"
        value={formData.key}
        onChange={(e) => setFormData({...formData, key: e.target.value})}
        style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem', boxSizing: 'border-box' }}
      />
      
      <input 
        type="number" 
        placeholder="Price"
        value={formData.price}
        onChange={(e) => setFormData({...formData, price: e.target.value})}
        style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem', boxSizing: 'border-box' }}
      />
      
      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
        Beat Image:
      </label>
      <input
        id="beat-image-input"
        type="file"
        accept="image/*"
        onChange={(e) => setImageFile(e.target.files[0])}
        style={{ marginBottom: '1rem', width: '100%' }}
      />
      
      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
        Beat Audio (MP3):
      </label>
      <input
        id="beat-audio-input"
        type="file"
        accept="audio/*"
        onChange={(e) => setAudioFile(e.target.files[0])}
        style={{ marginBottom: '1rem', width: '100%' }}
      />
      
      <button type="submit" disabled={loading} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#28a745', color: 'white', border: 'none', cursor: 'pointer' }}>
        {loading ? 'Adding...' : 'Add Beat'}
      </button>
    </form>
  );
}