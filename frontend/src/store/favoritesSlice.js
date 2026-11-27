import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchFavorites = createAsyncThunk('favorites/fetchFavorites', async (token) => {
  const res = await fetch('http://localhost:4000/api/favorites', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
});

export const addFavorite = createAsyncThunk('favorites/addFavorite', async ({ token, bookId }) => {
  await fetch('http://localhost:4000/api/favorites', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ bookId }),
  });
  return bookId;
});

export const removeFavorite = createAsyncThunk('favorites/removeFavorite', async ({ token, bookId }) => {
  const res = await fetch(`http://localhost:4000/api/v1/favorites/${encodeURIComponent(bookId)}`, {
    method: 'DELETE',
    headers: { Authorization: 'Bearer ' + token },
  });
  if (!res.ok) throw new Error('Failed to remove favorite');
  return bookId;
});

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState: { items: [], status: 'idle', removing: [], removeError: false },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchFavorites.pending, state => { state.status = 'loading'; })
      .addCase(fetchFavorites.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchFavorites.rejected, state => { state.status = 'failed'; })
      .addCase(addFavorite.fulfilled, (state, action) => {
        // After adding, fetch the updated favorites list to ensure UI is in sync
      })
      .addCase(removeFavorite.pending, (state, action) => {
        state.removing.push(action.meta.arg.bookId);
        state.removeError = false;
      })
      .addCase(removeFavorite.fulfilled, (state, action) => {
        state.items = state.items.filter(book => book.id !== action.payload);
        state.removing = state.removing.filter(id => id !== action.payload);
      })
      .addCase(removeFavorite.rejected, (state, action) => {
        state.removing = state.removing.filter(id => id !== action.meta.arg.bookId);
        state.removeError = true;
      });
  },
});

export default favoritesSlice.reducer;
