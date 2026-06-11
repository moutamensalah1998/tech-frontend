import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, filter, map, mergeMap, of, switchMap } from 'rxjs';
import { TagsService } from '../tags.service';
import * as TagsActions from './tags.actions';

@Injectable()
export class TagsEffects {
  constructor(
    private actions$: Actions,
    private tagsService: TagsService) {}

  getTags$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TagsActions.getTags),
      mergeMap(({ page, limit, searchTerm }) =>
        this.tagsService.getTags(page, limit, searchTerm).pipe(
          map((data) => TagsActions.getTagsSuccess({ data: data.data })),
          catchError((error) =>
            of(TagsActions.getTagsError({ error }))
          )
        )
      )
    )
  );

  addTag$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TagsActions.addTag),
      mergeMap(({ name }) =>
        this.tagsService.addTag(name).pipe(
          map((data) => TagsActions.addTagSuccess({ data: data.data })),
          catchError((error) =>
            of(TagsActions.addTagError({ error }))
          )
        )
      )
    )
  );

  deleteTag$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TagsActions.deleteTag),
      mergeMap(({ name }) =>
        this.tagsService.deleteTag(name).pipe(
          map((data) => TagsActions.deleteTagSuccess({ data: data.data })),
          catchError((error) =>
            of(TagsActions.deleteTagError({ error }))
          )
        )
      )
    )
  );

  updateTag$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TagsActions.updateTag),
      mergeMap(({ name, newName }) =>
        this.tagsService.editTag(name, newName).pipe(
          map((data) => TagsActions.updateTagSuccess({ data: data.data })),
          catchError((error) =>
            of(TagsActions.updateTagError({ error }))
          )
        )
      )
    )
  );

  refreshTagsAfterUpdate$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TagsActions.updateTagSuccess, TagsActions.addTagSuccess, TagsActions.deleteTagSuccess),
      map(() => TagsActions.getTags({ page: 1, limit: 5 }))
    )
  );
}
