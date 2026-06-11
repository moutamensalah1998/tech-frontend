import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TagsAttributesComponent } from "./components/tags/tags.component";
import { AttributeComponent } from "./components/attribute/attribute.component";
import { TranslatePipe } from '../../../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-tags-attribute',
  imports: [TagsAttributesComponent, AttributeComponent, TranslatePipe],
  templateUrl: './tags-attribute.component.html',
  styleUrl: './tags-attribute.component.css'
})
export class TagsAttributeComponent {

}
