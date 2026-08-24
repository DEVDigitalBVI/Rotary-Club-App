-- Any board member who can publish a notice may audit its acknowledgements.

drop policy if exists "news_acknowledgements_select" on news_acknowledgements;
create policy "news_acknowledgements_select"
  on news_acknowledgements for select to authenticated
  using (member_id = current_member_id() or is_board_member());

