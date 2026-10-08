import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from './shared/components/footer/footer';
import { BannerDemoComponent } from './shared/components/banner-demo/banner-demo';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FooterComponent, BannerDemoComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly tituloAplicacao = signal('el-sushi');
}
