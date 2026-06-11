import { attributesRoute } from "./components/attribute/attribute.routes";
import { tagsRoute } from "./components/tags/tags.routes";
import { TagsAttributeComponent } from "./tags-attribute.component";

export const tagsAndAttributesRoutes = {
    path: 'tags-and-attributes',
    component: TagsAttributeComponent,
    children:[
      tagsRoute,
      attributesRoute
    ]
}
