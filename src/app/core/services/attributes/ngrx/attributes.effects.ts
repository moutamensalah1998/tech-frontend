import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, filter, map, mergeMap, of, switchMap, withLatestFrom } from 'rxjs';
import { AttributesService } from '../attributtes.service';
import { addAttribute, addAttributeError, addAttributeSuccess, deleteAttribute, deleteAttributeError, deleteAttributeSuccess, getAttributes, getAttributesError, getAttributesSuccess, updateAttribute, updateAttributeError, updateAttributeSuccess } from './attributes.actions';
import { selectAttributesPagination } from './attributes.selectors';
import { Store } from '@ngrx/store';


@Injectable()
export class AttributesEffects {
  constructor(
    private actions$: Actions,
    private attributesService: AttributesService,
    private store: Store) { }

  getAttributes$ = createEffect(() =>
    this.actions$.pipe(
      ofType(getAttributes),
      mergeMap(({ page, limit, searchTerm }) =>
        this.attributesService.getAttributes(page, limit, searchTerm).pipe(
          map((data) => getAttributesSuccess({ data: data.data })),
          catchError((error) =>
            of(getAttributesError({ error }))
          )
        )
      )
    )
  );

  addAttribute$ = createEffect(() =>
    this.actions$.pipe(
      ofType(addAttribute),
      mergeMap(({ name }) =>
        this.attributesService.addAttribute(name).pipe(
          map((data) => addAttributeSuccess({ data: data.data })),
          catchError((error) =>
            of(addAttributeError({ error }))
          )
        )
      )
    )
  );

  deleteAttribute$ = createEffect(() =>
    this.actions$.pipe(
      ofType(deleteAttribute),
      mergeMap(({ name }) =>
        this.attributesService.deleteAttribute(name).pipe(
          map((data) => deleteAttributeSuccess({ data: data.data })),
          catchError((error) =>
            of(deleteAttributeError({ error }))
          )
        )
      )
    )
  );

  updateAttribute$ = createEffect(() =>
    this.actions$.pipe(
      ofType(updateAttribute),
      mergeMap(({ name, newName }) =>
        this.attributesService.editAttribute(name, newName).pipe(
          map((data) => updateAttributeSuccess({ data: data.data })),
          catchError((error) =>
            of(updateAttributeError({ error }))
          )
        )
      )
    )
  );

  addAttributeSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(addAttributeSuccess),
      withLatestFrom(this.store.select(selectAttributesPagination)),
      switchMap(([_, pagination]) =>
        of(getAttributes({
          page: pagination.page,
          limit: pagination.limit
        }))
      )
    )
  );

  deleteAttributeSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(deleteAttributeSuccess),
      withLatestFrom(this.store.select(selectAttributesPagination)),
      switchMap(([_, pagination]) =>
        of(getAttributes({
          page: pagination.page,
          limit: pagination.limit
        }))
      )
    )
  );

  updateAttributeSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(updateAttributeSuccess),
      withLatestFrom(this.store.select(selectAttributesPagination)),
      switchMap(([_, pagination]) =>
        of(getAttributes({
          page: pagination.page,
          limit: pagination.limit
        }))
      )
    )
  );
}
