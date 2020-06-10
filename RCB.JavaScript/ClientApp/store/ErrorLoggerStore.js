import { createSlice } from "@reduxjs/toolkit";
import AccountService from "@Services/AccountService";

// Create the slice.
const slice = createSlice({
  name: "errorLogger",
  initialState: {
    errorShowing: false,
    errorsQueue: [],
  },
  reducers: {
    addError: (state, action) => {
      state.errorsQueue = [action.payload, ...state.errorsQueue];
    },
    shiftError: (state, action) => {
      state.errorsQueue.shift();
      state.errorsQueue = [...state.errorsQueue];
    },
  },
});

// Export reducer from the slice.
export const { reducer } = slice;

// Define action creators.
export const actionCreators = {
  addError: (error) => async (dispatch) => {
    dispatch(slice.actions.addError(error));
  },
  shiftError: () => (dispatch) => {
    dispatch(slice.actions.shiftError());
  },
};
