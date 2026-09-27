-- Leave previously unclassified content visible under All videos; editors choose a category.
alter table public.learning_videos add column category text not null default ''
  check (category in ('', 'fun', 'lower', 'upper'));
update public.learning_videos set category = 'upper'
where id in ('4oXDoJkprx0', 'M-elC3LZvno');
update public.learning_videos set category = 'lower'
where id in ('nhw-0EdUDIw', '0uIq3qhulXE', 'e19qjbFKRl4');
