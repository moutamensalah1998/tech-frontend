import { createReducer, on } from '@ngrx/store';
import { AttributeModel } from '../../../models/attribute.model';
import { addAttribute, addAttributeError, addAttributeSuccess, getAttributes, getAttributesError, getAttributesSuccess, deleteAttribute, deleteAttributeError, deleteAttributeSuccess, updateAttribute, updateAttributeError, updateAttributeSuccess } from './attributes.actions';



export interface AttributesState {
  loading: boolean;
  error: any | null;
  data: AttributeModel | null;
  success: boolean
}

export const attributeInitialState: AttributesState = {
  loading: false,
  error: null,
  data: null,
  success: false

};
export const attributeReducer = createReducer(
  attributeInitialState,
  on(
    getAttributes,
    addAttribute,
    deleteAttribute,
    updateAttribute,
    (state) => ({ ...state, loading: true, error: null })
  ),
  on(
    getAttributesSuccess,
    (state, { data }) => ({ ...state, loading: false, data, success: true })
  ),
  on(
    addAttributeSuccess,
    deleteAttributeSuccess,
    updateAttributeSuccess,
    (state, { data }) => ({ ...state, loading: false, success: true })
  ),
  on(
    getAttributesError,
    addAttributeError,
    deleteAttributeError,
    updateAttributeError,
    (state, { error }) => ({ ...state, loading: false, error })
  )
);

